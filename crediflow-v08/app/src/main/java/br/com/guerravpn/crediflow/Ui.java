package br.com.guerravpn.crediflow;

import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;

final class Ui {
    static final int NAVY=Color.rgb(6,20,38), CARD=Color.rgb(14,36,60), CARD2=Color.rgb(18,45,73), BLUE=Color.rgb(36,132,255), WHITE=Color.rgb(247,249,252), MUTED=Color.rgb(169,184,205), GREEN=Color.rgb(44,201,137), AMBER=Color.rgb(244,183,59), RED=Color.rgb(255,107,107);
    private final MainActivityV06 a;
    Ui(MainActivityV06 a){this.a=a;}
    int dp(int v){return Math.round(v*a.getResources().getDisplayMetrics().density);}
    GradientDrawable bg(int c,int r){GradientDrawable g=new GradientDrawable();g.setColor(c);g.setCornerRadius(dp(r));return g;}
    LinearLayout page(){FrameLayout f=new FrameLayout(a);f.setBackgroundColor(NAVY);ScrollView s=new ScrollView(a);s.setFillViewport(true);LinearLayout l=new LinearLayout(a);l.setOrientation(LinearLayout.VERTICAL);l.setPadding(dp(24),dp(24),dp(24),dp(48));s.addView(l,new ScrollView.LayoutParams(-1,-2));f.addView(s,new FrameLayout.LayoutParams(-1,-1));a.setContentView(f);return l;}
    TextView text(String x,int size,int c,boolean bold){TextView t=new TextView(a);t.setText(x);t.setTextSize(size);t.setTextColor(c);if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;}
    TextView title(LinearLayout r,String x,int s){TextView t=text(x,s,WHITE,true);t.setPadding(0,dp(3),0,dp(8));r.addView(t);return t;}
    TextView body(LinearLayout r,String x){TextView t=text(x,16,MUTED,false);t.setLineSpacing(0,1.18f);t.setPadding(0,0,0,dp(9));r.addView(t);return t;}
    void caption(LinearLayout r,String x){TextView t=text(x,13,MUTED,false);t.setPadding(0,dp(5),0,dp(7));r.addView(t);}
    void eyebrow(LinearLayout r,String x){TextView t=text(x,14,BLUE,true);r.addView(t);}
    void spacer(LinearLayout r,int h){r.addView(new View(a),new LinearLayout.LayoutParams(1,dp(h)));}
    LinearLayout card(){LinearLayout l=new LinearLayout(a);l.setOrientation(LinearLayout.VERTICAL);l.setPadding(dp(18),dp(18),dp(18),dp(18));l.setBackground(bg(CARD,18));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.topMargin=dp(10);p.bottomMargin=dp(10);l.setLayoutParams(p);return l;}
    LinearLayout mini(){LinearLayout l=card();l.setBackground(bg(CARD2,14));return l;}
    void cardTitle(LinearLayout r,String x){TextView t=text(x,20,WHITE,true);t.setPadding(0,0,0,dp(7));r.addView(t);}
    Button primary(String x,View.OnClickListener c){return button(x,BLUE,WHITE,c,false);}
    Button outline(String x,View.OnClickListener c){return button(x,Color.TRANSPARENT,WHITE,c,true);}
    private Button button(String x,int c,int tc,View.OnClickListener l,boolean border){Button b=new Button(a);b.setText(x);b.setAllCaps(false);b.setTextSize(16);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setTextColor(tc);GradientDrawable g=bg(c,22);if(border)g.setStroke(dp(1),Color.rgb(81,98,124));b.setBackground(g);if(l!=null)b.setOnClickListener(l);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(58));p.topMargin=dp(7);p.bottomMargin=dp(4);b.setLayoutParams(p);return b;}
    EditText input(String h,int type){EditText e=new EditText(a);e.setHint(h);e.setHintTextColor(Color.rgb(125,145,170));e.setTextColor(WHITE);e.setTextSize(16);e.setInputType(type);e.setSingleLine((type&InputType.TYPE_TEXT_FLAG_MULTI_LINE)==0);e.setPadding(dp(16),0,dp(16),0);e.setBackground(bg(CARD2,14));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(58));p.topMargin=dp(6);p.bottomMargin=dp(5);e.setLayoutParams(p);return e;}
    CheckBox check(String x){CheckBox c=new CheckBox(a);c.setText(x);c.setTextColor(MUTED);c.setTextSize(14);c.setPadding(0,dp(7),0,dp(7));return c;}
    TextView error(){TextView t=text("",14,RED,false);t.setPadding(0,dp(4),0,dp(4));return t;}
    Spinner spinner(String[] v){Spinner s=new Spinner(a);ArrayAdapter<String> ad=new ArrayAdapter<String>(a,android.R.layout.simple_spinner_item,v){@Override public View getView(int p,View c,ViewGroup parent){TextView t=(TextView)super.getView(p,c,parent);t.setTextColor(WHITE);t.setTextSize(16);t.setPadding(dp(14),0,dp(14),0);return t;}};ad.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);s.setAdapter(ad);s.setBackground(bg(CARD2,14));s.setLayoutParams(new LinearLayout.LayoutParams(-1,dp(58)));return s;}
    void stat(LinearLayout r,String k,String v){LinearLayout row=new LinearLayout(a);row.setOrientation(LinearLayout.HORIZONTAL);TextView a1=text(k,14,MUTED,false),a2=text(v,14,WHITE,true);a2.setGravity(Gravity.END);row.addView(a1,new LinearLayout.LayoutParams(0,-2,1));row.addView(a2,new LinearLayout.LayoutParams(0,-2,1));row.setPadding(0,dp(4),0,dp(4));r.addView(row);}
    TextView badge(String x,int c){TextView t=text(x,13,c,true);t.setGravity(Gravity.CENTER);GradientDrawable g=bg(Color.argb(35,Color.red(c),Color.green(c),Color.blue(c)),18);g.setStroke(dp(1),Color.argb(120,Color.red(c),Color.green(c),Color.blue(c)));t.setBackground(g);t.setPadding(dp(12),dp(6),dp(12),dp(6));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-2,-2);p.topMargin=dp(5);p.bottomMargin=dp(7);t.setLayoutParams(p);return t;}
    void logo(LinearLayout r){LinearLayout row=new LinearLayout(a);row.setGravity(Gravity.CENTER_VERTICAL);TextView c=text("CF",26,WHITE,true);c.setGravity(Gravity.CENTER);GradientDrawable mark=bg(Color.rgb(79,70,229),18);mark.setStroke(dp(2),Color.rgb(139,92,246));c.setBackground(mark);row.addView(c,new LinearLayout.LayoutParams(dp(76),dp(76)));LinearLayout words=new LinearLayout(a);words.setOrientation(LinearLayout.VERTICAL);words.setPadding(dp(16),0,0,0);words.addView(text("CrediFlow",31,WHITE,true));words.addView(text("Crédito que impulsiona você",14,MUTED,false));row.addView(words,new LinearLayout.LayoutParams(0,-2,1));r.addView(row);}
    void back(LinearLayout r,Runnable run){Button b=outline("←  Voltar",v->run.run());LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-2,dp(46));p.bottomMargin=dp(14);b.setLayoutParams(p);r.addView(b);}
}
