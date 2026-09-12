package br.com.guerravpn.crediflow;

import android.app.AlertDialog;
import android.text.InputType;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;

import org.json.JSONObject;

import java.time.LocalDate;
import java.util.Locale;

final class LoanUi {
    private final MainActivityV06 a;
    private final Ui u;
    private EditText amount, installments, firstDue, pixKey;
    private Spinner pixType;
    private TextView error;
    private Button simulate;
    private LinearLayout previewBox;
    private JSONObject preview;

    LoanUi(MainActivityV06 activity){a=activity;u=activity.u;}

    void show(){
        LinearLayout root=u.page();u.back(root,a::showHome);u.eyebrow(root,"NOVO EMPRÉSTIMO");u.title(root,"Escolha seu crédito",31);u.body(root,"O valor, taxa e quantidade de parcelas respeitam o limite aprovado pelo Admin.");
        LinearLayout form=u.card();u.cardTitle(form,"Simulação");
        amount=u.input("Valor desejado · ex.: 50,00",InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
        installments=u.input("Quantidade de parcelas",InputType.TYPE_CLASS_NUMBER);
        firstDue=u.input("Primeira parcela · AAAA-MM-DD",InputType.TYPE_CLASS_DATETIME);firstDue.setText(LocalDate.now().plusMonths(1).toString());
        form.addView(amount);form.addView(installments);form.addView(firstDue);u.caption(form,"Chave Pix para receber o empréstimo");
        pixType=u.spinner(new String[]{"CPF","Celular","E-mail","Chave aleatória"});form.addView(pixType);pixKey=u.input("Chave Pix",InputType.TYPE_CLASS_TEXT);form.addView(pixKey);
        error=u.error();form.addView(error);simulate=u.primary("Simular empréstimo",null);form.addView(simulate);root.addView(form);
        previewBox=u.card();previewBox.setVisibility(View.GONE);root.addView(previewBox);simulate.setOnClickListener(v->simulate());
    }

    private void simulate(){
        error.setText("");final double value;final int count;
        try{String raw=amount.getText().toString().trim().replace(',','.');value=Double.parseDouble(raw);count=Integer.parseInt(installments.getText().toString().trim());if(value<=0||count<1)throw new IllegalArgumentException();}
        catch(Exception e){error.setText("Informe um valor e uma quantidade de parcelas válidos.");return;}
        String due=firstDue.getText().toString().trim();if(due.length()!=10){error.setText("Informe a primeira parcela no formato AAAA-MM-DD.");return;}
        a.busy(simulate,true,"Calculando...");a.io.execute(()->{try{Api.Resp response=Api.clientLoanPreview(a.accessToken,value,count,due);if(!response.ok())throw new Exception(response.errorMessage());JSONObject result=response.object();a.runOnUiThread(()->{a.busy(simulate,false,"Simular empréstimo");renderPreview(result);});}catch(Exception ex){a.runOnUiThread(()->{a.busy(simulate,false,"Simular empréstimo");error.setText(MainActivityV06.friendly(ex));});}});
    }

    private void renderPreview(JSONObject result){
        preview=result;previewBox.removeAllViews();previewBox.setVisibility(View.VISIBLE);u.cardTitle(previewBox,"Resumo da proposta");
        u.stat(previewBox,"Valor solicitado",MainActivityV06.money(result.optDouble("amount",0)));u.stat(previewBox,"Taxa mensal",MainActivityV06.percent(result.optDouble("monthlyRate",0)));u.stat(previewBox,"Juros estimados",MainActivityV06.money(result.optDouble("interestAmount",0)));u.stat(previewBox,"Parcelas",result.optInt("installments",1)+" × "+MainActivityV06.money(result.optDouble("installmentValue",0)));u.stat(previewBox,"Total a pagar",MainActivityV06.money(result.optDouble("total",0)));u.stat(previewBox,"1º vencimento",result.optString("firstDueDate",firstDue.getText().toString().trim()));u.stat(previewBox,"Juros por atraso",String.format(new Locale("pt","BR"),"%.4f%% ao dia",result.optDouble("lateInterestDailyRate",0)*100));u.stat(previewBox,"Multa por atraso",MainActivityV06.percent(result.optDouble("lateFeeRate",0)));
        LinearLayout contract=u.mini();u.cardTitle(contract,"Contrato eletrônico");String body=result.optString("contractBody","");if(body.length()>1600)body=body.substring(0,1600)+"…";u.body(contract,body);previewBox.addView(contract);
        CheckBox accept=u.check("Li a proposta, conferi o valor, juros, parcelas, vencimento, encargos de atraso e concordo com o contrato eletrônico.");previewBox.addView(accept);TextView submitError=u.error();previewBox.addView(submitError);Button request=u.primary("Assinar e solicitar",null);previewBox.addView(request);request.setOnClickListener(v->{if(!accept.isChecked()){submitError.setText("Confirme que leu e concorda com a proposta.");return;}submit(request,submitError);});
    }

    private void submit(Button button,TextView submitError){
        if(preview==null)return;String key=pixKey.getText().toString().trim();if(key.length()<3){submitError.setText("Informe a chave Pix que receberá o valor.");return;}
        final double value=preview.optDouble("amount",0);final int count=preview.optInt("installments",1);final String due=preview.optString("firstDueDate",firstDue.getText().toString().trim());final String type=pixTypeValue(pixType.getSelectedItemPosition());
        a.busy(button,true,"Enviando solicitação...");a.io.execute(()->{try{Api.Resp response=Api.clientLoanRequest(a.accessToken,value,count,due,type,key,"read");if(!response.ok())throw new Exception(response.errorMessage());JSONObject result=response.object();a.runOnUiThread(()->{a.busy(button,false,"Assinar e solicitar");new AlertDialog.Builder(a).setTitle("Solicitação enviada").setMessage("Contrato "+result.optString("contractNumber","")+" registrado. O Admin agora pode analisar a liberação do Pix.").setPositiveButton("Voltar ao início",(d,w)->a.showHome()).setCancelable(false).show();});}catch(Exception ex){a.runOnUiThread(()->{a.busy(button,false,"Assinar e solicitar");submitError.setText(MainActivityV06.friendly(ex));});}});
    }

    private String pixTypeValue(int position){switch(position){case 0:return"cpf";case 1:return"phone";case 2:return"email";default:return"random";}}
}
