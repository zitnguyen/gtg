import React, { useEffect, useMemo, useState } from 'react';
import { 
    Download, ChevronDown, Filter, Plus, MoreHorizontal,
    DollarSign, AlertTriangle, ShoppingCart, TrendingUp, TrendingDown,
    Edit, Trash2, Calendar, FileText, Search, Loader2, X
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import financeService from '../../../services/financeService';
import orderService from '../../../services/orderService';

const Finance = () => {
    const barChartRef = React.useRef(null);
    const [barChartWidth, setBarChartWidth] = useState(0);
    const [financialStats, setFinancialStats] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [costStructure, setCostStructure] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [tuitionDebtSummary, setTuitionDebtSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [newTransaction, setNewTransaction] = useState({
        type: 'income',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const { month, year } = selectedDate;
            
            const [statsRes, chartRes, costRes, trxRes, orderRes, debtRes] = await Promise.all([
                financeService.getFinanceStats(month, year),
                financeService.getFinanceChart(month, year),
                financeService.getCostStructure(month, year),
                financeService.getTransactions(month, year),
                orderService.getAll(),
                financeService.getTuitionDebts({ status: "all" }),
            ]);

            // Transform Stats Data
            if (statsRes.success) {
                const rawStats = statsRes.data;
                const mappedStats = rawStats.map((item) => {
                    let icon = DollarSign;
                    let color = 'bg-blue-50 text-blue-600';
                    let trendColor = 'text-green-600';
                    const label = String(item?.label || "").toLowerCase();

                    if (label.includes("chi phí")) {
                        icon = ShoppingCart;
                        color = 'bg-red-50 text-red-600';
                        trendColor = 'text-red-600';
                    } else if (label.includes("lợi nhuận")) {
                        icon = TrendingUp;
                        color = 'bg-green-50 text-green-600';
                        trendColor = 'text-green-600';
                    } else if (label.includes("khóa học")) {
                        icon = FileText;
                        color = 'bg-indigo-50 text-indigo-600';
                        trendColor = 'text-indigo-600';
                    }

                    return {
                        ...item,
                        valueFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.value),
                        icon,
                        color,
                        trendColor
                    };
                });
                setFinancialStats(mappedStats);
            }

            if (chartRes.success) {
                setChartData(chartRes.data);
            }

            if (costRes.success) {
                const formattedCost = costRes.data.map(item => ({
                    ...item,
                    valueFormatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.value)
                }));
                // Sort by value desc for better visualization
                formattedCost.sort((a,b) => b.value - a.value); 
                setCostStructure(formattedCost);
            }

            if (trxRes.success) {
                const formattedTrx = trxRes.data.map(trx => ({
                    ...trx,
                    amountFormatted: (trx.type === 'income' ? '+' : '-') + new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trx.amount),
                    dateFormatted: new Date(trx.date).toLocaleDateString('vi-VN')
                }));
                setTransactions(formattedTrx);
            }

            setOrders(Array.isArray(orderRes) ? orderRes : []);
            setTuitionDebtSummary(debtRes?.summary || null);

        } catch (error) {
            console.error("Error fetching finance data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [selectedDate]);

    useEffect(() => {
        const measureChart = () => {
            const width = barChartRef.current?.clientWidth || 0;
            setBarChartWidth(width);
        };
        measureChart();
        window.addEventListener("resize", measureChart);
        const timer = window.setTimeout(measureChart, 0);
        return () => {
            window.removeEventListener("resize", measureChart);
            window.clearTimeout(timer);
        };
    }, []);

    const handleMonthChange = (e) => {
        const [month, year] = e.target.value.split('-');
        setSelectedDate({ month: Number(month), year: Number(year) });
    };

    const handleExport = async () => {
        const { month, year } = selectedDate;
        try {
            await financeService.exportFinanceReport(month, year);
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    // Generate last 12 months for dropdown
    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        monthOptions.push({ value: `${m}-${y}`, label: `Tháng ${m}/${y}` });
    }

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newTransaction,
                source: newTransaction.type === 'income' ? newTransaction.category : undefined,
                category: newTransaction.type === 'expense' ? newTransaction.category : undefined
            };
            
            if (editingId) {
                 await financeService.updateTransaction(editingId, payload);
            } else {
                 await financeService.createTransaction(payload);
            }
            
            setShowModal(false);
            setEditingId(null);
            setNewTransaction({
                type: 'income',
                amount: '',
                description: '',
                category: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchAllData(); 
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
        }
    };

    const handleEdit = (trx) => {
        if (trx.id.startsWith('ENR')) {
            alert('Không thể sửa giao dịch học phí tại đây.');
            return;
        }
        
        const rawAmount = trx.amount.toString();
        
        setNewTransaction({
            type: trx.type,
            amount: rawAmount,
            description: trx.sub || '',
            category: trx.content || '',
            // Handle date parsing safely from ISO string or similar if available, or verify format
            // Based on backend, standard date format is usually ISO.
            date: new Date(trx.date).toISOString().split('T')[0]
        });
        setEditingId(trx.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (id.startsWith('ENR')) {
            alert('Không thể xóa giao dịch học phí tại đây.');
            return;
        }
        try {
            await financeService.deleteTransaction(id);
            setDeleteConfirm(null);
            fetchAllData();
        } catch (error) {
            console.error("Error deleting transaction:", error);
            alert("Lỗi khi xóa giao dịch");
        }
    };

    const openNewModal = () => {
        setEditingId(null);
        // Adjust to selected month/year if needed, or just today
        // Let's stick to today to allow accurate entry, or default to 1st of selected month if viewing past?
        // Let's us today if it matches current view, else 1st of viewed month.
        let initDate = new Date();
        if (selectedDate.month !== initDate.getMonth() + 1 || selectedDate.year !== initDate.getFullYear()) {
             initDate = new Date(selectedDate.year, selectedDate.month - 1, 1);
             // Adjust for timezone offset to avoid previous day
             initDate.setMinutes(initDate.getMinutes() - initDate.getTimezoneOffset());
        }
        
        setNewTransaction({
            type: 'income',
            amount: '',
            description: '',
            category: '',
            date: initDate.toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            setUpdatingOrderId(orderId);
            await orderService.updateStatus(orderId, status);
            await fetchAllData();
        } catch (error) {
            alert(error?.response?.data?.message || "Không cập nhật được trạng thái đơn hàng.");
        } finally {
            setUpdatingOrderId("");
        }
    };

    const handleRefundOrder = async (order) => {
        const remaining = Math.max(Number(order.totalAmount || 0) - Number(order.refundAmount || 0), 0);
        if (remaining <= 0) {
            alert("Đơn đã hoàn đủ.");
            return;
        }
        const rawAmount = window.prompt(
            `Nhập số tiền hoàn (tối đa ${remaining.toLocaleString("vi-VN")}đ). Để trống để hoàn toàn bộ còn lại.`,
            "",
        );
        if (rawAmount === null) return;
        const amount = rawAmount.trim() ? Number(rawAmount) : undefined;
        if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
            alert("Số tiền hoàn không hợp lệ.");
            return;
        }
        const reason = window.prompt("Lý do hoàn tiền?", "Phụ huynh yêu cầu hoàn tiền") || "";
        try {
            setUpdatingOrderId(order._id);
            await orderService.refund(order._id, { amount, reason });
            await fetchAllData();
        } catch (error) {
            alert(error?.response?.data?.message || "Không hoàn tiền được.");
        } finally {
            setUpdatingOrderId("");
        }
    };

    const filteredOrders = orders.filter((order) => {
        if (orderStatusFilter === "all") return true;
        return String(order?.status || "") === orderStatusFilter;
    });
    const normalizedChartData = useMemo(() => {
        const pickNumber = (...values) => {
            for (const value of values) {
                const num = Number(value);
                if (Number.isFinite(num)) return num;
            }
            return 0;
        };

        const fromApi = Array.isArray(chartData)
            ? chartData.map((item, index) => ({
                name: item?.name || item?.label || item?.monthLabel || item?.month || `M${index + 1}`,
                income: pickNumber(item?.income, item?.revenue, item?.thu, item?.in, item?.value, 0),
                expense: pickNumber(item?.expense, item?.cost, item?.chi, item?.out, item?.spending, 0),
            }))
            : [];

        const apiTotal = fromApi.reduce((sum, item) => sum + Math.abs(item.income) + Math.abs(item.expense), 0);
        if (fromApi.length > 0 && apiTotal > 0) return fromApi;

        if (!Array.isArray(transactions) || transactions.length === 0) return fromApi;

        const grouped = transactions.reduce((acc, trx) => {
            const dateKey = trx?.date ? new Date(trx.date).toLocaleDateString("vi-VN") : "N/A";
            if (!acc[dateKey]) {
                acc[dateKey] = { name: dateKey, income: 0, expense: 0 };
            }
            const amount = pickNumber(trx?.amount, trx?.value, 0);
            if (String(trx?.type).toLowerCase() === "income") acc[dateKey].income += amount;
            else acc[dateKey].expense += amount;
            return acc;
        }, {});

        return Object.values(grouped);
    }, [chartData, transactions]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                     <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <DollarSign className="text-primary" size={28} />
                        Tổng Quan Tài Chính
                    </h1>
                     <p className="text-sm text-muted-foreground mt-1">Theo dõi dòng tiền, doanh thu và chi phí hoạt động</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative w-full sm:w-auto">
                        <select 
                            className="w-full sm:w-auto bg-background border border-border text-foreground text-sm rounded-xl pl-4 pr-10 py-2.5 outline-none shadow-sm appearance-none cursor-pointer font-medium"
                            value={`${selectedDate.month}-${selectedDate.year}`}
                            onChange={handleMonthChange}
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 bg-background border border-border text-foreground rounded-xl transition-all text-sm font-medium shadow-sm"
                    >
                        <Download size={18} /> 
                        <span className="hidden sm:inline">Xuất báo cáo</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="animate-spin mb-3 text-primary" size={40} />
                    <span className="text-muted-foreground font-medium">Đang tải dữ liệu tài chính...</span>
                </div>
            ) : (
                <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {financialStats.map((stat, idx) => (
                        <div className="bg-background p-6 rounded-2xl shadow-sm border border-border relative overflow-hidden group hover:shadow-md transition-all duration-300" key={idx}>
                             <div className="flex justify-between items-start mb-4">
                                 <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{stat.label}</div>
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color} bg-opacity-50`}>
                                     <stat.icon size={20} />
                                 </div>
                             </div>
                             <div className="text-3xl font-bold text-foreground mb-2">{stat.valueFormatted}</div>
                             <div className="flex items-center gap-2 text-sm">
                                 {stat.change && (
                                     <span className={`flex items-center gap-1 font-medium ${
                                         (idx !== 1 && stat.trend === 'up') || (idx === 1 && stat.trend === 'down') 
                                            ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded' 
                                            : 'text-red-600 bg-red-50 px-2 py-0.5 rounded'
                                     }`}>
                                         {stat.trend === 'up' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                                         {stat.change}
                                     </span>
                                 )}
                                 {stat.sub && (
                                     <span className={`flex items-center gap-1 ${stat.trend === 'warning' ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                        {stat.trend === 'warning' && <AlertTriangle size={14} />}
                                        {stat.sub}
                                     </span>
                                 )}
                             </div>
                        </div>
                    ))}
                    <div className="bg-background p-6 rounded-2xl shadow-sm border border-amber-200 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Công nợ học phí</div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-600">
                                <AlertTriangle size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-2">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tuitionDebtSummary?.totalDebt || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {tuitionDebtSummary?.totalEnrollmentsWithDebt || 0} ghi danh còn nợ
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-background p-4 md:p-6 rounded-2xl shadow-sm border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                            <h3 className="font-bold text-foreground text-lg">Biểu đồ Thu Chi</h3>
                            <div className="flex items-center gap-4 text-sm font-medium">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="w-3 h-3 rounded-full bg-blue-600"></span> Doanh thu
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span> Chi phí
                                </div>
                            </div>
                        </div>
                        <div ref={barChartRef} className="h-56 sm:h-[300px] w-full min-w-0 sm:min-h-[300px]">
                            {normalizedChartData.length > 0 && barChartWidth > 0 ? (
                                <ResponsiveContainer width={Math.max(barChartWidth, 10)} height={300}>
                                    <BarChart data={normalizedChartData} barGap={8} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} tickFormatter={(value) => `${value/1000000}M`} />
                                        <Tooltip
                                            cursor={{ fill: "rgba(59,130,246,0.08)" }}
                                            formatter={(value, name) => {
                                                const label = name === "income" ? "Doanh thu" : "Chi phí";
                                                const amount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value) || 0);
                                                return [amount, label];
                                            }}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #d1d5db', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#111827' }}
                                        />
                                        <Bar dataKey="income" fill="#2563eb" radius={[4,4,0,0]} maxBarSize={40} />
                                        <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : normalizedChartData.length > 0 ? (
                                <div className="h-full w-full" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                                    Chưa có dữ liệu để hiển thị biểu đồ.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cost Structure */}
                    <div className="bg-background p-6 rounded-2xl shadow-sm border border-border flex flex-col">
                        <h3 className="font-bold text-foreground text-lg mb-6">Cơ cấu Chi phí</h3>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
                            {costStructure.map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-foreground">{item.label}</span>
                                        <div className="text-foreground font-bold">
                                            {item.valueFormatted}
                                            <span className="text-muted-foreground font-normal ml-1">({item.percent}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500" 
                                            style={{width: `${item.percent}%`, backgroundColor: item.color}}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {costStructure.length === 0 && (
                                <div className="text-center text-muted-foreground py-10">Chưa có dữ liệu chi phí</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                        <h3 className="font-bold text-gray-800 text-lg">Giao dịch gần đây</h3>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-medium">
                                <Filter size={16} /> Lọc
                            </button>
                            <button 
                                onClick={openNewModal}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-blue-500/30 transition-all text-sm font-medium"
                            >
                                <Plus size={18} /> Thêm GD
                            </button>
                        </div>
                    </div>
                    <div className="md:hidden divide-y divide-gray-100">
                        {transactions.map((trx) => (
                            <div key={`m-${trx.id}`} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">{trx.content}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{trx.sub || "—"}</div>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trx.type === 'income' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                        {trx.type === 'income' ? 'Thu nhập' : 'Chi phí'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{trx.dateFormatted}</span>
                                    <span className={`font-bold ${trx.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>{trx.amountFormatted}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {trx.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(trx)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => setDeleteConfirm(deleteConfirm === trx.id ? null : trx.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                {deleteConfirm === trx.id && (
                                    <div className="mt-1 rounded-lg border border-gray-200 p-2 flex items-center justify-end gap-2">
                                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-700">Hủy</button>
                                        <button onClick={() => handleDelete(trx.id)} className="px-3 py-1 text-xs rounded bg-red-500 text-white">Xóa</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {transactions.length === 0 && (
                            <div className="px-4 py-10 text-center text-gray-400 text-sm">
                                Không có giao dịch nào trong tháng này.
                            </div>
                        )}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã GD</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nội dung</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Số tiền</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                                {transactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {trx.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{trx.content}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{trx.sub}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                trx.type === 'income' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {trx.type === 'income' ? 'Thu nhập' : 'Chi phí'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {trx.dateFormatted}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                                            trx.type === 'income' ? 'text-blue-600' : 'text-red-600'
                                        }`}>
                                            {trx.amountFormatted}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                trx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {trx.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(trx)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <div className="relative">
                                                     <button 
                                                        onClick={() => setDeleteConfirm(deleteConfirm === trx.id ? null : trx.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    
                                                    {deleteConfirm === trx.id && (
                                                        <div className="absolute right-0 bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 min-w-[140px]">
                                                            <div className="text-xs text-center font-medium text-gray-700 mb-2">Xác nhận xóa?</div>
                                                            <div className="flex gap-2 justify-center">
                                                                <button 
                                                                    onClick={() => handleDelete(trx.id)}
                                                                    className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                                                >
                                                                    Xóa
                                                                </button>
                                                                <button 
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-400 text-sm">
                                            Không có giao dịch nào trong tháng này.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 text-lg">Đơn hàng khóa học</h3>
                        <p className="text-sm text-gray-500 mt-1">Duyệt đơn completed để tự mở quyền học khóa cho học viên.</p>
                        <div className="mt-3 w-full sm:w-[220px]">
                            <select
                                value={orderStatusFilter}
                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="partially_refunded">Partially refunded</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredOrders.map((order) => {
                            const firstCourse = order?.items?.[0]?.courseId;
                            const isPending = order.status === "pending";
                            const canRefund = ["completed", "partially_refunded"].includes(order.status);
                            return (
                                <div key={`mob-${order._id}`} className="p-4 space-y-2">
                                    <div className="text-xs text-gray-500 font-mono break-all">{order._id}</div>
                                    <div className="text-sm font-semibold text-gray-900">{firstCourse?.title || "-"}</div>
                                    <div className="text-sm text-gray-700">{order?.userId?.fullName || order?.userId?.email || "-"}</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-900">{Number(order.totalAmount || 0).toLocaleString("vi-VN")}đ</span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            order.status === "completed"
                                                ? "bg-green-100 text-green-800"
                                                : order.status === "cancelled"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    {isPending || canRefund ? (
                                        <div className="flex gap-2">
                                            {isPending && (
                                            <>
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order._id, "completed")}
                                                disabled={updatingOrderId === order._id}
                                                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white disabled:opacity-60"
                                            >
                                                Duyệt
                                            </button>
                                            <button
                                                onClick={() => handleUpdateOrderStatus(order._id, "cancelled")}
                                                disabled={updatingOrderId === order._id}
                                                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white disabled:opacity-60"
                                            >
                                                Từ chối
                                            </button>
                                            </>
                                            )}
                                            {canRefund && (
                                                <button
                                                    onClick={() => handleRefundOrder(order)}
                                                    disabled={updatingOrderId === order._id}
                                                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white disabled:opacity-60"
                                                >
                                                    Hoàn tiền
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-400">Không có thao tác</div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredOrders.length === 0 && (
                            <div className="px-4 py-10 text-center text-gray-400 text-sm">
                                Không có đơn hàng phù hợp bộ lọc.
                            </div>
                        )}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Học viên</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khóa học</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                                {filteredOrders.map((order) => {
                                    const firstCourse = order?.items?.[0]?.courseId;
                                    const isPending = order.status === "pending";
                                    const canRefund = ["completed", "partially_refunded"].includes(order.status);
                                    return (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{order._id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-800">{order?.userId?.fullName || order?.userId?.email || "-"}</td>
                                            <td className="px-6 py-4 text-sm text-gray-800">{firstCourse?.title || "-"}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{Number(order.totalAmount || 0).toLocaleString("vi-VN")}đ</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    order.status === "completed"
                                                        ? "bg-green-100 text-green-800"
                                                        : order.status === "cancelled"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isPending || canRefund ? (
                                                    <div className="flex justify-end gap-2">
                                                        {isPending && (
                                                        <>
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order._id, "completed")}
                                                            disabled={updatingOrderId === order._id}
                                                            className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white disabled:opacity-60"
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateOrderStatus(order._id, "cancelled")}
                                                            disabled={updatingOrderId === order._id}
                                                            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white disabled:opacity-60"
                                                        >
                                                            Từ chối
                                                        </button>
                                                        </>
                                                        )}
                                                        {canRefund && (
                                                            <button
                                                                onClick={() => handleRefundOrder(order)}
                                                                disabled={updatingOrderId === order._id}
                                                                className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white disabled:opacity-60"
                                                            >
                                                                Hoàn tiền
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredOrders.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-gray-400 text-sm">
                                            Không có đơn hàng phù hợp bộ lọc.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 text-lg">
                                {editingId ? 'Cập nhật giao dịch' : 'Thêm giao dịch mới'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Loại giao dịch</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-medium text-sm transition-all
                                            ${newTransaction.type === 'income' 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }
                                        `}
                                        onClick={() => !editingId && setNewTransaction({...newTransaction, type: 'income'})}
                                        disabled={!!editingId}
                                    >
                                        <TrendingUp size={16} /> Thu nhập
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-medium text-sm transition-all
                                            ${newTransaction.type === 'expense' 
                                                ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }
                                        `}
                                        onClick={() => !editingId && setNewTransaction({...newTransaction, type: 'expense'})}
                                        disabled={!!editingId}
                                    >
                                        <TrendingDown size={16} /> Chi phí
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Số tiền (VNĐ)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={newTransaction.amount} 
                                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                                        required 
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                                        placeholder="0"
                                    />
                                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={newTransaction.description} 
                                        onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Nhập nội dung giao dịch..."
                                    />
                                    <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">
                                    {newTransaction.type === 'income' ? 'Nguồn thu' : 'Danh mục chi'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={newTransaction.category} 
                                        onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})} 
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder={newTransaction.type === 'income' ? 'VD: Bán sách, Tài trợ...' : 'VD: Điện nước, Lương...'}
                                    />
                                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Ngày giao dịch</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={newTransaction.date} 
                                        onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})} 
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                     <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                                    onClick={() => setShowModal(false)}
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-blue-500/25 font-medium transition-colors"
                                >
                                    {editingId ? 'Cập nhật' : 'Lưu giao dịch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
