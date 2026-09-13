package br.com.guerravpn.crediflow;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

final class EarlyPaymentUi {
    private final MainActivityV06 a;
    private final Ui u;
    private final String loanId;
    private LinearLayout content;
    private TextView error;
    private Button uploadButton;

    EarlyPaymentUi(MainActivityV06 activity, String loanId) {
        this.a = activity;
        this.u = activity.u;
        this.loanId = loanId;
    }

    void show() {
        LinearLayout root = u.page();
        u.back(root, a::showHome);
        u.eyebrow(root, "QUITAÇÃO ANTECIPADA");
        u.title(root, "Pagar antecipado", 31);
        u.body(root, "Faça o Pix no valor exibido e envie o comprovante. O empréstimo só será quitado depois da conferência do Admin.");

        content = u.card();
        ProgressBar loading = new ProgressBar(a);
        content.addView(loading);
        root.addView(content);
        error = u.error();
        root.addView(error);

        a.io.execute(() -> {
            try {
                Api.Resp response = Api.clientEarlyPayoffInfo(a.accessToken, loanId);
                if (!response.ok()) throw new Exception(response.errorMessage());
                JSONObject info = response.object();
                a.runOnUiThread(() -> render(info));
            } catch (Exception ex) {
                a.runOnUiThread(() -> {
                    content.removeAllViews();
                    error.setText(MainActivityV06.friendly(ex));
                });
            }
        });
    }

    private void render(JSONObject info) {
        content.removeAllViews();
        error.setText("");
        JSONObject loan = info.optJSONObject("loan");
        JSONObject pix = info.optJSONObject("pix");
        JSONObject latest = info.optJSONObject("latestRequest");
        boolean eligible = info.optBoolean("eligible", false);
        double payoff = info.optDouble("payoffAmount", 0);

        u.cardTitle(content, "Valor para quitar agora");
        u.title(content, MainActivityV06.money(payoff), 31);
        u.body(content, "A antecipação considera o saldo vencido e o principal das parcelas futuras. Os juros futuros ainda não vencidos são retirados do valor de quitação.");

        if (pix == null || pix.optString("keyValue", "").isEmpty()) {
            content.addView(u.badge("Pix indisponível", Ui.RED));
            u.body(content, "A chave de pagamento ainda não foi configurada pelo Admin.");
            return;
        }

        u.cardTitle(content, "Pague por Pix");
        String keyType = pix.optString("keyType", "random");
        String keyValue = pix.optString("keyValue", "");
        u.stat(content, "Tipo", pixTypePt(keyType));
        TextView keyText = u.body(content, keyValue);
        keyText.setTextColor(Ui.WHITE);
        keyText.setTextIsSelectable(true);
        Button copy = u.outline("Copiar chave Pix", v -> copyPix(keyValue));
        content.addView(copy);
        String receiver = pix.optString("receiverName", "");
        if (!receiver.isEmpty()) u.stat(content, "Recebedor", receiver);

        if (latest != null) {
            String status = latest.optString("status", "");
            if ("pending".equals(status)) {
                content.addView(u.badge("Comprovante em análise", Ui.AMBER));
                u.stat(content, "Valor enviado para conferência", MainActivityV06.money(latest.optDouble("payoffAmount", payoff)));
                String file = latest.optString("proofFilename", "");
                if (!file.isEmpty()) u.caption(content, "Comprovante: " + file);
                u.body(content, "O Admin ainda precisa conferir o comprovante. Enquanto isso, não é necessário enviar novamente.");
                return;
            }
            if ("rejected".equals(status)) {
                content.addView(u.badge("Comprovante devolvido", Ui.RED));
                String note = latest.optString("reviewNote", "");
                u.body(content, note.isEmpty() ? "O Admin devolveu o comprovante. Envie um novo arquivo para nova conferência." : "Motivo informado pelo Admin: " + note);
            }
            if ("approved".equals(status)) {
                content.addView(u.badge("Quitado", Ui.GREEN));
                u.body(content, "O Admin confirmou o pagamento e o empréstimo foi quitado.");
                return;
            }
        }

        if (!eligible) {
            content.addView(u.badge("Quitação indisponível", Ui.AMBER));
            u.body(content, "Este empréstimo não está em uma situação que permita quitação antecipada agora.");
            return;
        }

        u.cardTitle(content, "Comprovante");
        u.body(content, "Depois de concluir o Pix, anexe uma imagem ou PDF do comprovante. O envio não quita automaticamente o empréstimo.");
        uploadButton = u.primary("Anexar comprovante", v -> a.pickEarlyPaymentProof(this));
        content.addView(uploadButton);
    }

    void onProofSelected(Uri uri) {
        if (uri == null) return;
        if (uploadButton != null) a.busy(uploadButton, true, "Enviando comprovante...");
        error.setText("");
        a.io.execute(() -> {
            try {
                String mime = a.getContentResolver().getType(uri);
                if (mime == null) mime = "application/octet-stream";
                String name = displayName(uri);
                byte[] bytes = a.read(uri);
                Api.Resp response = Api.clientEarlyPayoffSubmit(a.accessToken, loanId, name, mime, bytes);
                if (!response.ok()) throw new Exception(response.errorMessage());
                a.runOnUiThread(() -> {
                    Toast.makeText(a, "Comprovante enviado para conferência.", Toast.LENGTH_LONG).show();
                    show();
                });
            } catch (Exception ex) {
                a.runOnUiThread(() -> {
                    if (uploadButton != null) a.busy(uploadButton, false, "Anexar comprovante");
                    error.setText(MainActivityV06.friendly(ex));
                });
            }
        });
    }

    private String displayName(Uri uri) {
        String name = "comprovante";
        Cursor c = null;
        try {
            c = a.getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null);
            if (c != null && c.moveToFirst()) {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) name = c.getString(idx);
            }
        } catch (Exception ignored) {
        } finally {
            if (c != null) c.close();
        }
        return name == null || name.trim().isEmpty() ? "comprovante" : name.trim();
    }

    private void copyPix(String key) {
        ClipboardManager clipboard = (ClipboardManager) a.getSystemService(Context.CLIPBOARD_SERVICE);
        if (clipboard != null) clipboard.setPrimaryClip(ClipData.newPlainText("Chave Pix CrediFlow", key));
        Toast.makeText(a, "Chave Pix copiada.", Toast.LENGTH_SHORT).show();
    }

    private static String pixTypePt(String type) {
        if ("cpf".equals(type)) return "CPF";
        if ("phone".equals(type)) return "Celular";
        if ("email".equals(type)) return "E-mail";
        return "Chave aleatória";
    }
}
