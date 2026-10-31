import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram, Facebook, Linkedin, Shield, Truck, RotateCcw, HeadphonesIcon } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background:'#0f172a', color:'#94a3b8', fontFamily:'var(--font-sans)', marginTop:'auto' }}>
      {/* Trust bar */}
      <div style={{ borderBottom:'1px solid #1e293b' }}>
        <div className="container" style={{ display:'flex', flexWrap:'wrap', gap:16, padding:'28px 24px', justifyContent:'space-around' }}>
          {[
            { icon:<Truck size={20}/>, title:'Free Delivery', sub:'On orders above ₹999' },
            { icon:<RotateCcw size={20}/>, title:'Easy Returns', sub:'30-day hassle-free returns' },
            { icon:<Shield size={20}/>, title:'Secure Payment', sub:'256-bit SSL encrypted' },
            { icon:<HeadphonesIcon size={20}/>, title:'24/7 Support', sub:'Dedicated customer care' },
          ].map(t => (
            <div key={t.title} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ color:'#6366f1' }}>{t.icon}</div>
              <div>
                <div style={{ color:'#e2e8f0', fontWeight:600, fontSize:14 }}>{t.title}</div>
                <div style={{ fontSize:12, marginTop:1 }}>{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer content */}
      <div className="container" style={{ padding:'48px 24px 32px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:36 }}>
        {/* Brand */}
        <div>
          <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:900, fontSize:24, letterSpacing:'-.04em', marginBottom:10 }}>NOVA</div>
          <p style={{ fontSize:14, lineHeight:1.7, marginBottom:20, color:'#64748b' }}>
            Everything You Need. One Destination. Premium shopping experience for millions of happy customers.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            {[Twitter, Instagram, Facebook, Linkedin, Github].map((Icon, i) => (
              <a key={i} href="#" style={{ width:34, height:34, borderRadius:8, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', transition:'all 200ms' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#6366f1';e.currentTarget.style.color='#fff';}}
                onMouseLeave={e=>{e.currentTarget.style.background='#1e293b';e.currentTarget.style.color='#64748b';}}
              ><Icon size={15}/></a>
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ color:'#e2e8f0', fontSize:13, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:16 }}>Company</h4>
          {['About Us','Careers','Press','Blog','Investor Relations'].map(l => <FooterLink key={l} href="#">{l}</FooterLink>)}
        </div>

        {/* Support */}
        <div>
          <h4 style={{ color:'#e2e8f0', fontSize:13, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:16 }}>Support</h4>
          {['Help Center','Contact Us','Shipping Information','Returns & Refunds','Track Your Order','Size Guide'].map(l => <FooterLink key={l} href="#">{l}</FooterLink>)}
        </div>

        {/* Legal */}
        <div>
          <h4 style={{ color:'#e2e8f0', fontSize:13, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:16 }}>Legal</h4>
          {['Privacy Policy','Terms & Conditions','Cookie Policy','Accessibility'].map(l => <FooterLink key={l} href="#">{l}</FooterLink>)}
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:12, color:'#475569', marginBottom:8 }}>Accepted Payments</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {['Visa','Mastercard','RuPay','UPI','NetBanking'].map(p => (
                <span key={p} style={{ padding:'3px 8px', background:'#1e293b', border:'1px solid #334155', borderRadius:5, fontSize:11, fontWeight:600, color:'#94a3b8' }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop:'1px solid #1e293b' }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:13, color:'#475569' }}>© {year} NOVA Commerce. All rights reserved. — Synthetic demo environment.</div>
          <Link to="/security-lab" style={{ fontSize:12, color:'#ef4444', fontWeight:600, display:'flex', alignItems:'center', gap:5, opacity:.7 }}>
            <Shield size={12}/> Security Lab
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }) {
  return (
    <a href={href} style={{ display:'block', fontSize:14, color:'#64748b', marginBottom:9, transition:'color 150ms' }}
      onMouseEnter={e=>e.target.style.color='#e2e8f0'} onMouseLeave={e=>e.target.style.color='#64748b'}>
      {children}
    </a>
  );
}

