import React, { useState, useEffect } from 'react';
import inquiryService from '../../../services/inquiryService';
import { Mail, Phone, MessageSquare, Archive, Trash2 } from 'lucide-react';

const InquiryList = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const data = await inquiryService.getAll();
            setInquiries(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching inquiries:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await inquiryService.update(id, { status: newStatus });
            setInquiries(prev => prev.map(item => 
                item._id === id ? { ...item, status: newStatus } : item
            ));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Lỗi cập nhật trạng thái");
        }
    };

    const handleDeleteInquiry = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa liên hệ này?')) return;
        try {
            await inquiryService.delete(id);
            setInquiries((prev) => prev.filter((item) => item._id !== id));
        } catch (error) {
            console.error("Error deleting inquiry:", error);
            alert("Lỗi khi xóa liên hệ");
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'New': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Mới</span>;
            case 'Contacted': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Đã liên hệ</span>;
            case 'Converted': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Đã ghi danh</span>;
            case 'Closed': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Đóng</span>;
            default: return status;
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản Lý Liên Hệ</h1>
                <p className="text-gray-500">Danh sách các yêu cầu tư vấn và đăng ký học thử</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 text-center py-10">Đang tải dữ liệu...</div>
                ) : inquiries.length > 0 ? (
                    inquiries.map((inquiry) => (
                        <div key={inquiry._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900">{inquiry.name}</h3>
                                    <span className="text-xs text-gray-400">{new Date(inquiry.createdAt).toLocaleString('vi-VN')}</span>
                                </div>
                                {getStatusBadge(inquiry.status)}
                            </div>
                            
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {inquiry.phone}
                                </div>
                                {inquiry.email && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="w-4 h-4 mr-2" />
                                        {inquiry.email}
                                    </div>
                                )}
                                <div className="flex items-start text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    <MessageSquare className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                                    <span className="italic">{inquiry.message || "Không có lời nhắn"}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex gap-2">
                                <button 
                                    onClick={() => handleStatusUpdate(inquiry._id, 'Contacted')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded border ${inquiry.status === 'Contacted' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Đã gọi
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(inquiry._id, 'Converted')}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded border ${inquiry.status === 'Converted' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Thành công
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(inquiry._id, 'Closed')}
                                    className={`py-1.5 px-2 text-xs font-medium rounded border ${inquiry.status === 'Closed' ? 'bg-gray-100 text-gray-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                    title="Đóng (Spam/Hủy)"
                                >
                                    <Archive className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteInquiry(inquiry._id)}
                                    className="py-1.5 px-2 text-xs font-medium rounded border border-red-200 text-red-600 hover:bg-red-50"
                                    title="Xóa liên hệ"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-100">
                        Chưa có liên hệ nào.
                    </div>
                )}
            </div>
        </div>
    );
};

export default InquiryList;
