import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';

const PublicLayout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="public-layout">
      {/* Header */}
      <header className="public-header">
        <div className="container header-inner">
          <Link to="/" className="brand-link">
            <div className="brand-icon">
                ♟
            </div>
            <span className="brand-text">ZCHESS</span>
          </Link>

          <nav className="nav-links">
            <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Trang chủ</NavLink>
            <NavLink to="/gallery" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Thư viện ảnh</NavLink>
            <NavLink to="/store" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Khóa học Online</NavLink>
            <NavLink to="/about" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Về chúng tôi</NavLink>
          </nav>

          <div className="header-actions">
            <Link to="/login" className="btn-ghost" style={{color: '#64748B'}}>Đăng nhập</Link>
            <Link to="/contact" className="btn-primary">Đăng ký ngay</Link>
          </div>

          <button className="mobile-menu-btn md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
             {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Content (Basic) */}
      {isMenuOpen && (
        <div style={{
            position:'fixed', top:'72px', left:0, right:0, bottom:0, background:'white', zIndex:999, padding:'24px',
            display: 'flex', flexDirection: 'column', gap: '24px'
        }}>
            <NavLink to="/" className="text-xl font-bold" onClick={()=>setIsMenuOpen(false)}>Trang chủ</NavLink>
            <NavLink to="/store" className="text-xl font-bold" onClick={()=>setIsMenuOpen(false)}>Khóa học</NavLink>
             <div style={{height:'1px', background:'#eee'}}></div>
            <Link to="/login" className="btn-ghost" style={{textAlign:'center'}} onClick={()=>setIsMenuOpen(false)}>Đăng nhập</Link>
            <Link to="/contact" className="btn-primary" style={{textAlign:'center'}} onClick={()=>setIsMenuOpen(false)}>Đăng ký ngay</Link>
        </div>
      )}

      <main style={{flex: 1}}>
        {children}
      </main>

      {/* Footer */}
      <footer className="footer-premium">
        <div className="container">
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:'60px'}}>
                <div>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', color:'white', fontWeight:'800', fontSize:'24px', marginBottom:'24px'}}>
                         <div style={{width:'32px', height:'32px', background:'var(--color-accent)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>♟</div>
                         ZCHESS
                    </div>
                    <p style={{lineHeight:'1.6', marginBottom:'24px'}}>
                        Nền tảng đào tạo cờ vua chuẩn quốc tế hàng đầu Việt Nam. Giúp trẻ phát triển tư duy toàn diện.
                    </p>
                    <div style={{display:'flex', gap:'12px'}}>
                        {/* Social Placeholders */}
                        <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.1)'}}></div>
                        <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.1)'}}></div>
                        <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.1)'}}></div>
                    </div>
                </div>
                
                <div>
                     <h4 className="footer-heading">Sản phẩm</h4>
                     <ul className="footer-list">
                         <li><Link to="/store">Khóa học Online</Link></li>
                         <li><Link to="/store">Dụng cụ thi đấu</Link></li>
                         <li><Link to="/test">Bài test năng lực</Link></li>
                     </ul>
                </div>
                 <div>
                     <h4 className="footer-heading">Về chúng tôi</h4>
                     <ul className="footer-list">
                         <li><Link to="/about">Giới thiệu</Link></li>
                         <li><Link to="/contact">Liên hệ</Link></li>
                         <li><Link to="/careers">Tuyển dụng</Link></li>
                     </ul>
                </div>
                 <div>
                     <h4 className="footer-heading">Hỗ trợ</h4>
                     <ul className="footer-list">
                         <li><a href="#">Trung tâm trợ giúp</a></li>
                         <li><a href="#">Điều khoản sử dụng</a></li>
                         <li><a href="#">Chính sách bảo mật</a></li>
                     </ul>
                </div>
            </div>
            <div style={{borderTop:'1px solid #1E293B', marginTop:'60px', paddingTop:'24px', textAlign:'center', color:'#64748B'}}>
                © 2024 Z Chess Center. All rights reserved.
            </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
