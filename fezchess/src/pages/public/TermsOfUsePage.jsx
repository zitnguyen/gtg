import React from "react";

const TermsOfUsePage = () => {
  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Điều khoản sử dụng</h1>
        <div className="space-y-6 text-muted-foreground leading-7">
          <p>
            Khi sử dụng nền tảng Z Chess, bạn đồng ý tuân thủ các điều khoản dưới
            đây nhằm đảm bảo môi trường học tập minh bạch và an toàn.
          </p>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              1. Phạm vi áp dụng
            </h2>
            <p>
              Điều khoản này áp dụng cho toàn bộ người dùng truy cập website và
              các tính năng liên quan đến khóa học, tài khoản và nội dung học tập.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              2. Trách nhiệm người dùng
            </h2>
            <p>
              Người dùng chịu trách nhiệm bảo mật tài khoản, cung cấp thông tin
              chính xác và không sử dụng hệ thống vào mục đích vi phạm pháp luật.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              3. Nội dung và bản quyền
            </h2>
            <p>
              Tài liệu, bài giảng và nội dung trên nền tảng thuộc quyền sở hữu của
              Z Chess hoặc đối tác, không được sao chép trái phép.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              4. Cập nhật điều khoản
            </h2>
            <p>
              Chúng tôi có thể cập nhật điều khoản theo từng thời điểm. Việc tiếp
              tục sử dụng hệ thống sau khi cập nhật được xem là đồng ý với nội
              dung mới.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
