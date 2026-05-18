/**
 * @legacy Form đăng ký thử nghiệm; thay bằng ContactPage + CRM inquiries.
 */
import React, { useState } from 'react';
import leadService from "../../../services/leadService";
import { CheckCircle, ShieldCheck } from 'lucide-react';

const TestRegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        studentAge: '',
        note: ''
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await leadService.create(formData);
            setIsSubmitted(true);
        } catch (error) {
            alert("Có lỗi xảy ra, vui lòng thử lại hoặc gọi hotline.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

  if (isSubmitted) {
      return (
          <div style={{minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'24px'}}>
              <div style={{width:'80px', height:'80px', background:'#DCFCE7', color:'#16A34A', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px'}}>
                  <CheckCircle size={40} />
              </div>
              <h2 style={{fontSize:'30px', fontWeight:'700', color:'#111827', marginBottom:'16px'}}>Đăng ký thành công!</h2>
              <p style={{color:'#4B5563', maxWidth:'500px', fontSize:'18px'}}>
                  Cảm ơn bạn đã quan tâm. Bộ phận tư vấn của Z Chess sẽ liên hệ với bạn trong vòng 24h để sắp xếp lịch test năng lực cho bé.
              </p>
              <div style={{marginTop:'32px'}}>
                  <a href="/" style={{color:'var(--color-brand-blue)', fontWeight:'bold', textDecoration:'underline'}}>Quay về trang chủ</a>
              </div>
          </div>
      )
  }

  return (
    <div className="form-section">
      <div className="register-info">
         <h1 style={{fontSize:'42px', fontFamily:'var(--font-heading)', color:'var(--color-brand-blue-strong)', marginBottom:'24px'}}>ĐĂNG KÝ <span style={{color:'var(--color-brand-red)'}}>TEST NĂNG LỰC</span></h1>
         <p style={{fontSize:'18px', color:'#4B5563', marginBottom:'32px', lineHeight:'1.6'}}>
             Để lại thông tin để nhận tư vấn lộ trình học phù hợp nhất và nhận ưu đãi <span style={{fontWeight:'bold', color:'var(--color-brand-red)'}}>GIẢM 20%</span> học phí khóa đầu tiên.
         </p>
         
         <div style={{background:'#F0F9FF', padding:'24px', borderRadius:'12px', borderLeft:'4px solid var(--color-brand-blue)'}}>
             <h3 style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'18px', fontWeight:'bold', marginBottom:'16px', color:'var(--color-brand-blue-strong)'}}>
                 <ShieldCheck size={24} /> Cam kết từ Z Chess
             </h3>
             <ul style={{listStyle:'none', padding:0, color:'#374151', fontSize:'15px'}}>
                 <li style={{marginBottom:'12px'}}>✓ Kiểm tra trình độ 5 kỹ năng toàn diện</li>
                 <li style={{marginBottom:'12px'}}>✓ Tư vấn 1:1 với Kiện tướng/HLV Quốc tế</li>
                 <li style={{marginBottom:'12px'}}>✓ Học thử miễn phí 01 buổi trải nghiệm</li>
                 <li>✓ Cam kết không phát sinh chi phí ẩn</li>
             </ul>
         </div>
      </div>

      <div className="form-box">
          <h2 style={{fontSize:'24px', fontFamily:'var(--font-heading)', textAlign:'center', marginBottom:'24px', color:'var(--color-brand-blue-strong)'}}>FORM ĐĂNG KÝ</h2>
          <form onSubmit={handleSubmit}>
              <div>
                  <input 
                    className="form-input"
                    required
                    placeholder="Họ tên phụ huynh (*)"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
              </div>
              <div>
                  <input 
                    className="form-input"
                    required
                    placeholder="Số điện thoại liên hệ (*)"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
              </div>
              <div>
                  <input 
                    className="form-input"
                    type="number"
                    placeholder="Tuổi của bé"
                    value={formData.studentAge}
                    onChange={e => setFormData({...formData, studentAge: e.target.value})}
                  />
              </div>
               <div>
                  <textarea 
                    className="form-input"
                    rows="4"
                    placeholder="Ghi chú thêm (khả năng cờ vua hiện tại của bé...)"
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                  ></textarea>
              </div>
              <button 
                disabled={loading}
                type="submit" 
                className="btn-submit-lg"
                style={{opacity: loading ? 0.7 : 1}}
              >
                  {loading ? 'Đang gửi...' : 'GỬI ĐĂNG KÝ NGAY'}
              </button>
              <p style={{textAlign:'center', fontSize:'12px', color:'#999', marginTop:'16px'}}>
                  Chúng tôi cam kết bảo mật thông tin cá nhân của bạn.
              </p>
          </form>
      </div>
    </div>
  );
};

export default TestRegisterPage;
