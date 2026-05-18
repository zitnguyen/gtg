import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Chính sách bảo mật</h1>
        <div className="space-y-6 text-muted-foreground leading-7">
          <p>
            Z Chess cam kết bảo vệ thông tin cá nhân của người dùng khi truy cập
            và sử dụng nền tảng.
          </p>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              1. Thông tin thu thập
            </h2>
            <p>
              Chúng tôi có thể thu thập các thông tin cần thiết như họ tên, số
              điện thoại, email và dữ liệu sử dụng dịch vụ để hỗ trợ vận hành hệ
              thống.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              2. Mục đích sử dụng
            </h2>
            <p>
              Dữ liệu được dùng để cung cấp dịch vụ học tập, chăm sóc khách hàng,
              gửi thông báo liên quan đến tài khoản và cải thiện trải nghiệm.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              3. Bảo mật thông tin
            </h2>
            <p>
              Chúng tôi áp dụng các biện pháp kỹ thuật và quản trị phù hợp để hạn
              chế truy cập trái phép, mất mát hoặc rò rỉ thông tin.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              4. Quyền của người dùng
            </h2>
            <p>
              Người dùng có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá
              nhân theo quy định và chính sách hiện hành của hệ thống.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
