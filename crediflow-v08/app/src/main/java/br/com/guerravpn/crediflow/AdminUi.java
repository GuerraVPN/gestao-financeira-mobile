package br.com.guerravpn.crediflow;

import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

final class AdminUi {
    private final MainActivityV06 a;
    private final Ui u;

    AdminUi(MainActivityV06 activity){a=activity;u=activity.u;}

    void show(){
        LinearLayout root=u.page();
        u.eyebrow(root,"ADMINISTRAÇÃO");
        u.title(root,"Painel Admin",33);
        u.body(root,"Análise manual de cadastros, limites, taxas, empréstimos e pagamentos antecipados.");

        LinearLayout summary=u.card();
        u.cardTitle(summary,"Resumo");
        TextView summaryLoading=u.body(summary,"Carregando pendências e ativos...");
        root.addView(summary);

        LinearLayout actions=u.card();
        u.cardTitle(actions,"Operação");
        Button loansButton=u.primary("Solicitações de empréstimo",v->showLoans());
        Button earlyButton=u.outline("Pagamentos antecipados",v->showEarlyPayments());
        actions.addView(loansButton);
        actions.addView(earlyButton);
        actions.addView(u.outline("Atualizar cadastros",v->show()));
        actions.addView(u.outline("Sair do Admin",v->a.logout()));
        root.addView(actions);

        LinearLayout info=u.card();
        u.cardTitle(info,"Regra da análise");
        u.body(info,"O Admin consulta os dados e define manualmente limite, risco, juros, parcelas, multa e juros de atraso. Pagamentos enviados por comprovante também só são quitados depois da conferência manual do Admin.");
        root.addView(info);

        u.title(root,"Análises",26);
        LinearLayout list=u.card();
        TextView loading=u.body(list,"Carregando cadastros...");
        root.addView(list);

        a.io.execute(()->{
            try{
                String path="/rest/v1/credit_applications?select=id,status,email,full_name,phone,monthly_income,approved_limit,approved_risk_tier,approved_monthly_rate,approved_max_installments,approved_late_interest_daily_rate,approved_late_fee_rate,created_at&order=created_at.desc&limit=500";
                Api.Resp response=Api.get(path,a.accessToken);
                if(!response.ok())throw new Exception(response.errorMessage());
                JSONArray items=response.array();

                int reviewCount=0,activeFromApps=0;
                for(int i=0;i<items.length();i++){
                    JSONObject app=items.optJSONObject(i);
                    if(app==null)continue;
                    String st=app.optString("status");
                    if("under_review".equals(st)||"correction_required".equals(st))reviewCount++;
                    if("active".equals(st))activeFromApps++;
                }

                int pendingLoans=-1,activeLoans=-1;
                try{
                    Api.Resp loanResponse=Api.get("/rest/v1/loans?select=id,status&limit=1000",a.accessToken);
                    if(loanResponse.ok()){
                        JSONArray loans=loanResponse.array();pendingLoans=0;activeLoans=0;
                        for(int i=0;i<loans.length();i++){
                            JSONObject loan=loans.optJSONObject(i);if(loan==null)continue;
                            String st=loan.optString("status");
                            if("requested".equals(st))pendingLoans++;
                            if("active".equals(st)||"late".equals(st))activeLoans++;
                        }
                    }
                }catch(Exception ignored){}

                int activeAccounts=activeFromApps;
                try{
                    Api.Resp profiles=Api.get("/rest/v1/profiles?select=user_id,account_status&account_status=eq.active&limit=1000",a.accessToken);
                    if(profiles.ok())activeAccounts=profiles.array().length();
                }catch(Exception ignored){}

                int pendingEarly=-1;
                try{
                    Api.Resp early=Api.adminEarlyPayments(a.accessToken);
                    if(early.ok())pendingEarly=early.object().optInt("pendingCount",0);
                }catch(Exception ignored){}

                final int fReview=reviewCount,fPending=pendingLoans,fActiveLoans=activeLoans,fActiveAccounts=activeAccounts,fEarly=pendingEarly;
                a.runOnUiThread(()->{
                    summary.removeView(summaryLoading);
                    u.stat(summary,"Solicitações pendentes",fPending<0?"—":String.valueOf(fPending));
                    u.stat(summary,"Quitações para conferir",fEarly<0?"—":String.valueOf(fEarly));
                    u.stat(summary,"Empréstimos ativos",fActiveLoans<0?"—":String.valueOf(fActiveLoans));
                    u.stat(summary,"Contas ativas",String.valueOf(fActiveAccounts));
                    u.stat(summary,"Cadastros em análise",String.valueOf(fReview));
                    if(fPending>0)loansButton.setText("Solicitações de empréstimo · "+fPending+" pendente"+(fPending==1?"":"s"));
                    else if(fPending==0)loansButton.setText("Solicitações de empréstimo · 0 pendentes");
                    if(fEarly>0){earlyButton.setText("Pagamentos antecipados · "+fEarly+" pendente"+(fEarly==1?"":"s"));summary.addView(u.badge(fEarly+" quitação"+(fEarly==1?" aguardando":" aguardando"),Ui.AMBER));}
                    else if(fEarly==0)earlyButton.setText("Pagamentos antecipados · 0 pendentes");
                    renderApplications(list,loading,items);
                });
            }catch(Exception ex){
                a.runOnUiThread(()->{summaryLoading.setText("Não foi possível atualizar o resumo.");loading.setText(MainActivityV06.friendly(ex));});
            }
        });
    }

    private void renderApplications(LinearLayout list,TextView loading,JSONArray items){
        list.removeView(loading);
        if(items.length()==0){u.body(list,"Nenhum cadastro recebido.");return;}
        for(int i=0;i<items.length();i++){
            JSONObject app=items.optJSONObject(i);if(app==null)continue;
            LinearLayout card=u.mini();
            u.cardTitle(card,app.optString("full_name","Cliente"));
            u.body(card,app.optString("email",""));
            card.addView(u.badge(MainActivityV06.statusPt(app.optString("status")),MainActivityV06.statusColor(app.optString("status"))));
            if(!app.isNull("monthly_income"))u.stat(card,"Renda informada",MainActivityV06.money(app.optDouble("monthly_income",0)));
            if(!app.isNull("approved_limit"))u.stat(card,"Limite",MainActivityV06.money(app.optDouble("approved_limit",0)));
            card.addView(u.outline("Abrir análise",v->showApplication(app)));
            list.addView(card);
        }
    }

    private void showApplication(JSONObject app){
        LinearLayout root=u.page();u.back(root,this::show);u.eyebrow(root,"ANÁLISE MANUAL");u.title(root,app.optString("full_name","Cliente"),29);u.body(root,app.optString("email","")+" · "+app.optString("phone",""));
        String appStatus=app.optString("status");root.addView(u.badge(MainActivityV06.statusPt(appStatus),MainActivityV06.statusColor(appStatus)));
        LinearLayout current=u.card();u.cardTitle(current,"Dados da solicitação");if(!app.isNull("monthly_income"))u.stat(current,"Renda mensal",MainActivityV06.money(app.optDouble("monthly_income",0)));u.stat(current,"Cadastro",app.optString("created_at","").replace('T',' '));root.addView(current);

        LinearLayout policy=u.card();u.cardTitle(policy,"Condições aprovadas");
        EditText limit=u.input("Limite aprovado · R$",InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
        EditText risk=u.input("Faixa de risco · ex.: baixo",InputType.TYPE_CLASS_TEXT);
        EditText monthly=u.input("Juros ao mês · %",InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
        EditText maxInstallments=u.input("Máximo de parcelas",InputType.TYPE_CLASS_NUMBER);
        EditText lateDaily=u.input("Juros de atraso ao dia · %",InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
        EditText lateFee=u.input("Multa por atraso · %",InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
        EditText notes=u.input("Observação da análise",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        if(!app.isNull("approved_limit"))limit.setText(decimal(app.optDouble("approved_limit",0)));
        risk.setText(app.optString("approved_risk_tier","baixo"));
        if(!app.isNull("approved_monthly_rate"))monthly.setText(decimal(app.optDouble("approved_monthly_rate",0)*100));
        if(!app.isNull("approved_max_installments"))maxInstallments.setText(String.valueOf(app.optInt("approved_max_installments",1)));
        if(!app.isNull("approved_late_interest_daily_rate"))lateDaily.setText(decimal(app.optDouble("approved_late_interest_daily_rate",0)*100));
        if(!app.isNull("approved_late_fee_rate"))lateFee.setText(decimal(app.optDouble("approved_late_fee_rate",0)*100));

        boolean updating="approved".equals(appStatus)||"activation_sent".equals(appStatus)||"active".equals(appStatus);
        policy.addView(limit);policy.addView(risk);policy.addView(monthly);policy.addView(maxInstallments);policy.addView(lateDaily);policy.addView(lateFee);policy.addView(notes);
        TextView error=u.error();policy.addView(error);
        Button approve=u.primary(updating?"Atualizar condições":"Aprovar cadastro",null),reject=u.outline("Rejeitar cadastro",null);
        policy.addView(approve);if(!"active".equals(appStatus)&&!"activation_sent".equals(appStatus))policy.addView(reject);
        if("approved".equals(appStatus)||"activation_sent".equals(appStatus)){Button activation=u.primary("Enviar código de ativação por e-mail",null);policy.addView(activation);activation.setOnClickListener(v->sendActivation(app,activation,error));}
        root.addView(policy);

        approve.setOnClickListener(v->{try{JSONObject body=new JSONObject();body.put("applicationId",app.optString("id"));body.put("decision","approved");body.put("approvedLimit",parse(limit));body.put("riskTier",risk.getText().toString().trim());body.put("monthlyRate",parse(monthly)/100d);body.put("maxInstallments",Integer.parseInt(maxInstallments.getText().toString().trim()));body.put("lateInterestDailyRate",parse(lateDaily)/100d);body.put("lateFeeRate",parse(lateFee)/100d);body.put("notes",notes.getText().toString().trim());review(body,approve,error,updating);}catch(Exception ex){error.setText("Confira limite, taxas e número de parcelas.");}});
        reject.setOnClickListener(v->{try{JSONObject body=new JSONObject();body.put("applicationId",app.optString("id"));body.put("decision","rejected");body.put("notes",notes.getText().toString().trim());review(body,reject,error,false);}catch(Exception ex){error.setText("Não foi possível montar a decisão.");}});
    }

    private void review(JSONObject body,Button button,TextView error,boolean updating){
        String normal=button.getText().toString();a.busy(button,true,"Salvando...");
        a.io.execute(()->{try{Api.Resp response=Api.adminRecordReview(a.accessToken,body);if(!response.ok())throw new Exception(response.errorMessage());a.runOnUiThread(()->{a.busy(button,false,normal);boolean approved=body.optString("decision").equals("approved");new AlertDialog.Builder(a).setTitle(updating&&approved?"Condições atualizadas":"Análise registrada").setMessage(approved?(updating?"Limite, juros, parcelas e encargos foram atualizados.":"Cadastro aprovado. Agora você pode enviar o código de ativação."):"Cadastro rejeitado.").setPositiveButton("OK",(d,w)->show()).show();});}catch(Exception ex){a.runOnUiThread(()->{a.busy(button,false,normal);error.setText(MainActivityV06.friendly(ex));});}});
    }

    private void sendActivation(JSONObject app,Button button,TextView error){
        a.busy(button,true,"Enviando e-mail...");
        a.io.execute(()->{try{Api.Resp response=Api.adminSendActivation(a.accessToken,app.optString("id"));if(!response.ok())throw new Exception(response.errorMessage());a.runOnUiThread(()->{a.busy(button,false,"Enviar código de ativação por e-mail");new AlertDialog.Builder(a).setTitle("Código enviado").setMessage("O código de ativação foi enviado para "+app.optString("email","o cliente")+".").setPositiveButton("OK",null).show();});}catch(Exception ex){a.runOnUiThread(()->{a.busy(button,false,"Enviar código de ativação por e-mail");error.setText(MainActivityV06.friendly(ex));});}});
    }

    void showLoans(){
        LinearLayout root=u.page();u.back(root,this::show);u.eyebrow(root,"EMPRÉSTIMOS");u.title(root,"Solicitações",31);u.body(root,"Confira o contrato e a chave Pix antes de confirmar que o valor foi enviado.");
        LinearLayout list=u.card();TextView loading=u.body(list,"Carregando solicitações...");root.addView(list);
        a.io.execute(()->{try{Api.Resp response=Api.adminLoanRequests(a.accessToken);if(!response.ok())throw new Exception(response.errorMessage());JSONArray items=response.object().optJSONArray("items");if(items==null)items=new JSONArray();JSONArray finalItems=items;a.runOnUiThread(()->renderLoans(list,loading,finalItems));}catch(Exception ex){a.runOnUiThread(()->loading.setText(MainActivityV06.friendly(ex)));}});
    }

    private void renderLoans(LinearLayout list,TextView loading,JSONArray items){
        list.removeView(loading);if(items.length()==0){u.body(list,"Nenhuma solicitação de empréstimo.");return;}
        for(int i=0;i<items.length();i++){
            JSONObject loan=items.optJSONObject(i);if(loan==null)continue;
            JSONObject profile=loan.optJSONObject("profile"),pix=loan.optJSONObject("pix"),contract=loan.optJSONObject("contract");
            LinearLayout card=u.mini();u.cardTitle(card,profile==null?"Cliente":profile.optString("full_name","Cliente"));card.addView(u.badge(MainActivityV06.statusPt(loan.optString("status")),MainActivityV06.statusColor(loan.optString("status"))));u.stat(card,"Solicitado",MainActivityV06.money(loan.optDouble("principal",0)));u.stat(card,"Juros",MainActivityV06.money(loan.optDouble("interest_amount",0)));u.stat(card,"Total",MainActivityV06.money(loan.optDouble("total_amount",0)));u.stat(card,"Parcelas",loan.optInt("installments_count",1)+"x");u.stat(card,"1º vencimento",loan.optString("first_due_date","-"));if(pix!=null)u.stat(card,"Pix",pix.optString("key_type","")+" · "+pix.optString("key_value",pix.optString("key_masked","")));if(contract!=null)u.stat(card,"Contrato",contract.optString("contract_number","-"));card.addView(u.outline("Ver detalhes",v->showLoan(loan)));list.addView(card);
        }
    }

    private void showLoan(JSONObject loan){
        LinearLayout root=u.page();u.back(root,this::showLoans);JSONObject profile=loan.optJSONObject("profile"),pix=loan.optJSONObject("pix"),contract=loan.optJSONObject("contract");u.eyebrow(root,"SOLICITAÇÃO DE CRÉDITO");u.title(root,profile==null?"Cliente":profile.optString("full_name","Cliente"),29);if(profile!=null)u.body(root,profile.optString("email","")+" · "+profile.optString("phone",""));root.addView(u.badge(MainActivityV06.statusPt(loan.optString("status")),MainActivityV06.statusColor(loan.optString("status"))));
        LinearLayout details=u.card();u.cardTitle(details,"Condições");u.stat(details,"Valor",MainActivityV06.money(loan.optDouble("principal",0)));u.stat(details,"Taxa mensal",MainActivityV06.percent(loan.optDouble("monthly_interest_rate",0)));u.stat(details,"Juros",MainActivityV06.money(loan.optDouble("interest_amount",0)));u.stat(details,"Total",MainActivityV06.money(loan.optDouble("total_amount",0)));u.stat(details,"Parcelas",String.valueOf(loan.optInt("installments_count",1)));u.stat(details,"Primeiro vencimento",loan.optString("first_due_date","-"));u.stat(details,"Juros atraso/dia",String.format(new Locale("pt","BR"),"%.4f%%",loan.optDouble("late_interest_daily_rate",0)*100));u.stat(details,"Multa atraso",MainActivityV06.percent(loan.optDouble("late_fee_rate",0)));root.addView(details);
        LinearLayout payment=u.card();u.cardTitle(payment,"Liberação por Pix");if(pix!=null){u.stat(payment,"Tipo",pix.optString("key_type","-"));u.stat(payment,"Chave",pix.optString("key_value",pix.optString("key_masked","-")));if(!pix.optString("holder_name","").isEmpty())u.stat(payment,"Titular",pix.optString("holder_name"));if(!pix.optString("institution_name","").isEmpty())u.stat(payment,"Instituição",pix.optString("institution_name"));}else u.body(payment,"Chave Pix não encontrada.");if(contract!=null)u.stat(payment,"Contrato",contract.optString("contract_number","-"));EditText note=u.input("Observação da transferência",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_MULTI_LINE);payment.addView(note);TextView error=u.error();payment.addView(error);if("requested".equals(loan.optString("status"))){Button confirm=u.primary("Confirmar Pix enviado",null),reject=u.outline("Rejeitar solicitação",null);payment.addView(confirm);payment.addView(reject);confirm.setOnClickListener(v->confirmLoan(loan,note,confirm,error));reject.setOnClickListener(v->rejectLoan(loan,note,reject,error));}root.addView(payment);
        JSONArray installments=loan.optJSONArray("installments");if(installments!=null&&installments.length()>0){LinearLayout schedule=u.card();u.cardTitle(schedule,"Parcelas geradas");for(int i=0;i<installments.length();i++){JSONObject it=installments.optJSONObject(i);if(it==null)continue;u.stat(schedule,"#"+it.optInt("installment_number")+" · "+it.optString("due_date"),MainActivityV06.money(it.optDouble("amount_due",0))+" · "+MainActivityV06.statusPt(it.optString("status")));}root.addView(schedule);}
    }

    private void confirmLoan(JSONObject loan,EditText note,Button button,TextView error){new AlertDialog.Builder(a).setTitle("Confirmar liberação").setMessage("Confirme somente depois de enviar o Pix para a chave exibida. Isso ativará o empréstimo e gerará as parcelas.").setNegativeButton("Cancelar",null).setPositiveButton("Confirmar",(d,w)->{a.busy(button,true,"Confirmando...");a.io.execute(()->{try{Api.Resp response=Api.adminConfirmDisbursement(a.accessToken,loan.optString("id"),note.getText().toString().trim());if(!response.ok())throw new Exception(response.errorMessage());a.runOnUiThread(this::showLoans);}catch(Exception ex){a.runOnUiThread(()->{a.busy(button,false,"Confirmar Pix enviado");error.setText(MainActivityV06.friendly(ex));});}});}).show();}
    private void rejectLoan(JSONObject loan,EditText note,Button button,TextView error){a.busy(button,true,"Rejeitando...");a.io.execute(()->{try{Api.Resp response=Api.adminRejectLoan(a.accessToken,loan.optString("id"),note.getText().toString().trim());if(!response.ok())throw new Exception(response.errorMessage());a.runOnUiThread(this::showLoans);}catch(Exception ex){a.runOnUiThread(()->{a.busy(button,false,"Rejeitar solicitação");error.setText(MainActivityV06.friendly(ex));});}});}

    void showEarlyPayments(){
        LinearLayout root=u.page();u.back(root,this::show);u.eyebrow(root,"QUITAÇÃO ANTECIPADA");u.title(root,"Comprovantes",31);u.body(root,"Confira o valor, o comprovante e o pagamento. Só confirme a quitação quando estiver tudo certo.");
        LinearLayout list=u.card();TextView loading=u.body(list,"Carregando comprovantes...");root.addView(list);
        a.io.execute(()->{try{Api.Resp response=Api.adminEarlyPayments(a.accessToken);if(!response.ok())throw new Exception(response.errorMessage());JSONArray items=response.object().optJSONArray("items");if(items==null)items=new JSONArray();JSONArray finalItems=items;a.runOnUiThread(()->renderEarlyPayments(list,loading,finalItems));}catch(Exception ex){a.runOnUiThread(()->loading.setText(MainActivityV06.friendly(ex)));}});
    }

    private void renderEarlyPayments(LinearLayout list,TextView loading,JSONArray items){
        list.removeView(loading);if(items.length()==0){u.body(list,"Nenhum comprovante de quitação enviado.");return;}
        for(int i=0;i<items.length();i++){
            JSONObject item=items.optJSONObject(i);if(item==null)continue;JSONObject profile=item.optJSONObject("profile");
            LinearLayout card=u.mini();u.cardTitle(card,profile==null?"Cliente":profile.optString("full_name","Cliente"));if(profile!=null)u.body(card,profile.optString("email",""));String status=item.optString("status");card.addView(u.badge(earlyStatusPt(status),MainActivityV06.statusColor(status)));u.stat(card,"Valor para quitação",MainActivityV06.money(item.optDouble("payoff_amount",0)));u.stat(card,"Enviado",item.optString("submitted_at","-").replace('T',' '));String note=item.optString("review_note","");if(!note.isEmpty())u.caption(card,"Motivo/observação: "+note);card.addView(u.outline("Conferir",v->showEarlyPayment(item)));list.addView(card);
        }
    }

    private void showEarlyPayment(JSONObject item){
        LinearLayout root=u.page();u.back(root,this::showEarlyPayments);JSONObject profile=item.optJSONObject("profile"),loan=item.optJSONObject("loan");u.eyebrow(root,"CONFERÊNCIA DE PAGAMENTO");u.title(root,profile==null?"Cliente":profile.optString("full_name","Cliente"),29);if(profile!=null)u.body(root,profile.optString("email","")+" · "+profile.optString("phone",""));String status=item.optString("status");root.addView(u.badge(earlyStatusPt(status),MainActivityV06.statusColor(status)));

        LinearLayout details=u.card();u.cardTitle(details,"Quitação antecipada");u.stat(details,"Valor esperado",MainActivityV06.money(item.optDouble("payoff_amount",0)));if(loan!=null){u.stat(details,"Empréstimo",MainActivityV06.money(loan.optDouble("principal",0)));u.stat(details,"Status do empréstimo",MainActivityV06.statusPt(loan.optString("status")));}u.stat(details,"Pix usado",item.optString("pix_key_value","-"));u.stat(details,"Comprovante",item.optString("proof_filename","-"));u.caption(details,"O valor antecipado já desconsidera os juros futuros ainda não vencidos.");String proofUrl=item.optString("proofUrl","");if(!proofUrl.isEmpty())details.addView(u.primary("Abrir comprovante",v->openProof(proofUrl)));else u.body(details,"Não foi possível gerar o link do comprovante.");root.addView(details);

        LinearLayout decision=u.card();u.cardTitle(decision,"Conferência do Admin");EditText note=u.input("Observação ou motivo da devolução",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_MULTI_LINE);decision.addView(note);TextView error=u.error();decision.addView(error);
        String oldNote=item.optString("review_note","");if(!oldNote.isEmpty())note.setText(oldNote);
        if("pending".equals(status)){
            Button approve=u.primary("Confirmar pagamento e quitar",null),reject=u.outline("Devolver comprovante",null);decision.addView(approve);decision.addView(reject);
            approve.setOnClickListener(v->new AlertDialog.Builder(a).setTitle("Quitar empréstimo?").setMessage("Confirme somente se o valor e o comprovante estiverem corretos. As parcelas abertas serão encerradas e o empréstimo ficará como pago.").setNegativeButton("Cancelar",null).setPositiveButton("Confirmar",(d,w)->reviewEarlyPayment(item,"approved",note,approve,error)).show());
            reject.setOnClickListener(v->{if(note.getText().toString().trim().length()<3){error.setText("Explique o que aconteceu para o cliente poder corrigir e reenviar.");return;}reviewEarlyPayment(item,"rejected",note,reject,error);});
        }else{
            u.body(decision,"Esta conferência já foi finalizada.");
        }
        root.addView(decision);
    }

    private void reviewEarlyPayment(JSONObject item,String decision,EditText note,Button button,TextView error){
        String normal=button.getText().toString();a.busy(button,true,"Salvando...");
        a.io.execute(()->{try{Api.Resp response=Api.adminReviewEarlyPayment(a.accessToken,item.optString("id"),decision,note.getText().toString().trim());if(!response.ok())throw new Exception(response.errorMessage());a.runOnUiThread(()->new AlertDialog.Builder(a).setTitle("approved".equals(decision)?"Empréstimo quitado":"Comprovante devolvido").setMessage("approved".equals(decision)?"Pagamento confirmado. O empréstimo foi marcado como pago.":"O cliente verá o motivo informado e poderá enviar um novo comprovante.").setPositiveButton("OK",(d,w)->showEarlyPayments()).setCancelable(false).show());}catch(Exception ex){a.runOnUiThread(()->{a.busy(button,false,normal);error.setText(MainActivityV06.friendly(ex));});}});
    }

    private void openProof(String url){
        try{Intent i=new Intent(Intent.ACTION_VIEW, Uri.parse(url));a.startActivity(i);}catch(Exception ex){new AlertDialog.Builder(a).setTitle("Comprovante").setMessage("Não foi possível abrir o arquivo neste aparelho.").setPositiveButton("OK",null).show();}
    }

    private static String earlyStatusPt(String status){if("pending".equals(status))return"Aguardando conferência";if("approved".equals(status))return"Quitado";if("rejected".equals(status))return"Devolvido";return MainActivityV06.statusPt(status);}
    private static double parse(EditText e){return Double.parseDouble(e.getText().toString().trim().replace(',','.'));}
    private static String decimal(double value){if(Math.rint(value)==value)return String.format(Locale.US,"%.0f",value);return String.format(Locale.US,"%.4f",value).replaceAll("0+$","").replaceAll("\\.$","");}
}
