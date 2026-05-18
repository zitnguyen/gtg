import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Search, Phone, Mail, MapPin, User, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import parentService from "../../../services/parentService";
import TableSkeleton from "../../../components/ui/TableSkeleton";
import useUndoDelete from "../../../hooks/useUndoDelete";
import { useTheme } from "../../../context/ThemeContext";

const ParentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [highlightedRowId, setHighlightedRowId] = useState(null);
  const { scheduleUndoDelete } = useUndoDelete();
  const { isDark } = useTheme();
  const lastToastKeyRef = useRef("");

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    const updatedParent = location.state?.updatedParent;
    if (!updatedParent?._id) return;
    const toastKey = `parent-updated-${updatedParent._id}-${location.state?.updatedAt || ""}`;
    if (lastToastKeyRef.current === toastKey) return;
    lastToastKeyRef.current = toastKey;

    setParents((prevParents) => {
      const index = prevParents.findIndex((item) => item._id === updatedParent._id);
      if (index === -1) {
        return [updatedParent, ...prevParents];
      }
      const next = [...prevParents];
      next[index] = { ...next[index], ...updatedParent };
      return next;
    });
    setHighlightedRowId(updatedParent._id);
    toast.success("✔ Cập nhật thành công", {
      id: toastKey,
      icon: <CheckCircle2 size={16} />,
    });
    navigate(location.pathname, { replace: true, state: {} });
    const timeout = setTimeout(() => setHighlightedRowId(null), 2500);
    return () => clearTimeout(timeout);
  }, [location.state?.updatedAt, location.pathname, navigate]);

  const fetchParents = async () => {
    try {
      const data = await parentService.getAll();
      setParents(data);
    } catch (error) {
      console.error("Error fetching parents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const deletingParent = parents.find((p) => p._id === id);
    if (!deletingParent) return;
    setDeleteConfirm(null);
    scheduleUndoDelete({
      id,
      item: deletingParent,
      removeOptimistic: () => setParents((prev) => prev.filter((p) => p._id !== id)),
      restoreOptimistic: (parent) => setParents((prev) => [parent, ...prev]),
      commitDelete: () => parentService.delete(id),
      pendingMessage: "Đã xóa phụ huynh — Hoàn tác?",
      successMessage: "✔ Xóa phụ huynh thành công",
      errorMessage: "Lỗi khi xóa phụ huynh",
    });
  };

  const filteredParents = parents.filter(
    (p) =>
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Phụ huynh</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin liên lạc của phụ huynh</p>
        </div>
        <button 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
            onClick={() => navigate("/parents/new")}
        >
          <Plus size={18} />
          <span>Thêm phụ huynh</span>
        </button>
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
           <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SĐT, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ tên</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên lạc</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Hành động</span></th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {loading ? (
                <TableSkeleton rows={6} cols={4} />
              ) : filteredParents.length > 0 ? (
                filteredParents.map((parent) => (
                  <motion.tr
                    key={parent._id}
                    initial={{ opacity: 0.5, scale: 0.98 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      backgroundColor:
                        highlightedRowId === parent._id
                          ? isDark
                            ? "rgb(6 46 26)"
                            : "rgb(240 253 244)"
                          : isDark
                            ? "rgb(0 0 0)"
                            : "rgb(255 255 255)",
                    }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <User size={18} />
                            </div>
                            <div className="font-medium text-gray-900">{parent.fullName}</div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} className="text-gray-400"/> {parent.phone}
                            </div>
                            {parent.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Mail size={14} className="text-gray-400"/> {parent.email}
                                </div>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                             <MapPin size={16} className="text-gray-400" /> 
                             <span className="truncate max-w-[200px]">{parent.address || "---"}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          onClick={() => navigate(`/parents/${parent._id}`)}
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <div className="relative">
                            <button
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => setDeleteConfirm(parent._id)}
                            title="Xóa"
                            >
                            <Trash2 size={18} />
                            </button>
                             {deleteConfirm === parent._id && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
                                    <p className="text-xs text-gray-700 mb-3 font-medium text-center">Xóa phụ huynh này?</p>
                                    <div className="flex gap-2 justify-center">
                                        <button 
                                            onClick={() => handleDelete(parent._id)} 
                                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                                        >
                                            Xóa
                                        </button>
                                        <button 
                                            onClick={() => setDeleteConfirm(null)}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy dữ liệu phụ huynh phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParentList;
