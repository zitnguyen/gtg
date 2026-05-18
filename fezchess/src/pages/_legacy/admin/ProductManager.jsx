/**
 * @legacy CRUD `/products` không còn route BE; quản lý khóa học dùng AdminCourseList.
 * Không gắn router; xem `pages/_legacy/README.md`.
 */
import React, { useState, useEffect } from "react";
import productService from "../services/productService";
import { Edit, Trash2, Plus, MonitorPlay } from "lucide-react";

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: 0,
        thumbnailUrl: "",
        videoUrl: "",
        category: "Beginner",
        isActive: true
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await productService.getAll(true); // isAdmin=true
            setProducts(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await productService.update(editingId, formData);
                alert("Cập nhật thành công!");
            } else {
                await productService.create(formData);
                alert("Tạo khóa học thành công!");
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({
                title: "", description: "", price: 0, thumbnailUrl: "", videoUrl: "", category: "Beginner", isActive: true
            });
            fetchProducts();
        } catch (error) {
            alert("Lỗi: " + error.message);
        }
    };

    const handleEdit = (p) => {
        setFormData({
            title: p.title,
            description: p.description,
            price: p.price,
            thumbnailUrl: p.thumbnailUrl,
            videoUrl: p.videoUrl,
            category: p.category,
            isActive: p.isActive
        });
        setEditingId(p._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa khóa học này?")) {
            try {
                await productService.delete(id);
                fetchProducts();
            } catch (error) {
                alert("Lỗi xóa: " + error.message);
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản Lý Khóa Học Video</h1>
                <button 
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ title: "", description: "", price: 0, thumbnailUrl: "", videoUrl: "", category: "Beginner", isActive: true });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} /> Thêm khóa học
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên khóa học</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Video URL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {products.map(p => (
                            <tr key={p._id}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 mr-4 bg-gray-100 rounded flex items-center justify-center">
                                            {p.thumbnailUrl ? <img src={p.thumbnailUrl} className="h-10 w-10 rounded object-cover" /> : <MonitorPlay size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{p.title}</div>
                                            <div className="text-gray-500 text-sm">{p.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{p.price.toLocaleString()}đ</td>
                                <td className="px-6 py-4 max-w-xs truncate text-gray-500">{p.videoUrl}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {p.isActive ? 'Active' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-900"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Sửa Khóa Học' : 'Thêm Khóa Học Mới'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Tên khóa học</label>
                                <input required className="w-full border p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Giá (VNĐ)</label>
                                    <input type="number" required className="w-full border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Danh mục</label>
                                    <select className="w-full border p-2 rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        <option value="Beginner">Cơ bản</option>
                                        <option value="Intermediate">Trung cấp</option>
                                        <option value="Advanced">Nâng cao</option>
                                        <option value="Other">Khác</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Mô tả</label>
                                <textarea className="w-full border p-2 rounded" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Thumbnail URL (Ảnh)</label>
                                <input className="w-full border p-2 rounded" placeholder="https://..." value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Video URL / Embed Code</label>
                                <input required className="w-full border p-2 rounded" placeholder="https://youtube.com/..." value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
                                <p className="text-xs text-gray-500 mt-1">Hỗ trợ link YouTube hoặc link file trực tiếp (.mp4)</p>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="mr-2" />
                                <label htmlFor="isActive">Hiển thị công khai</label>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManager;
