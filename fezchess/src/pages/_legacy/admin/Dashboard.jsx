/**
 * @legacy Thay bằng `pages/Admin/Dashboard/MainDashboard.jsx` (route `/dashboard`).
 * Giữ để tham khảo biểu đồ cũ; không import trong App.jsx.
 */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  DollarSign,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import studentService from "../../../services/studentService";
import enrollmentService from "../../../services/enrollmentService";
import financeService from "../../../services/financeService";
import { getSkillLevelLabel } from "../../../utils/studentLevel";

const Dashboard = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [levelData, setLevelData] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [revenueGrowth, setRevenueGrowth] = useState("0%");
  const [studentGrowth, setStudentGrowth] = useState("0%");
  const [enrollmentGrowth, setEnrollmentGrowth] = useState("0%");
  const [newEnrollmentsCount, setNewEnrollmentsCount] = useState(0);
  const revenueChartRef = React.useRef(null);
  const levelChartRef = React.useRef(null);
  const [revenueChartWidth, setRevenueChartWidth] = useState(0);
  const [levelChartWidth, setLevelChartWidth] = useState(0);

  // Fetch data from backend
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const measureCharts = () => {
      const revenueWidth = revenueChartRef.current?.clientWidth || 0;
      const levelWidth = levelChartRef.current?.clientWidth || 0;
      setRevenueChartWidth(revenueWidth);
      setLevelChartWidth(levelWidth);
    };
    measureCharts();
    window.addEventListener("resize", measureCharts);
    const timer = window.setTimeout(measureCharts, 0);
    return () => {
      window.removeEventListener("resize", measureCharts);
      window.clearTimeout(timer);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Students
      const studentsResponse = await studentService.getAll();
      const students = studentsResponse || [];
      setTotalStudents(students.length);

      // Time variables
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();

      // Calc Student Growth
      const studentsPriorToThisMonth = students.filter(s => {
          if (!s.enrollmentDate) return false;
          const d = new Date(s.enrollmentDate);
          return d < new Date(thisYear, thisMonth, 1);
      }).length;

      if (studentsPriorToThisMonth > 0) {
          const growth = ((students.length - studentsPriorToThisMonth) / studentsPriorToThisMonth) * 100;
          setStudentGrowth((growth > 0 ? "+" : "") + growth.toFixed(0) + "%");
      } else {
          setStudentGrowth(students.length > 0 ? "+100%" : "0%");
      }

      // 2. Fetch Enrollments
      const enrollments = await enrollmentService.getAll();
      
      const enrollmentsThisMonth = enrollments.filter(e => {
          const d = new Date(e.enrollmentDate);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length;
      setNewEnrollmentsCount(enrollmentsThisMonth);

      const enrollmentsLastMonth = enrollments.filter(e => {
          const d = new Date(e.enrollmentDate);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      }).length;

      if (enrollmentsLastMonth > 0) {
          const eGrowth = ((enrollmentsThisMonth - enrollmentsLastMonth) / enrollmentsLastMonth) * 100;
          setEnrollmentGrowth((eGrowth > 0 ? "+" : "") + eGrowth.toFixed(0) + "%");
      } else {
          setEnrollmentGrowth(enrollmentsThisMonth > 0 ? "+100%" : "0%");
      }

      // Recent Enrollments Table Data (Top 5 this month)
      const recentEnr = enrollments.filter(e => {
         const d = new Date(e.enrollmentDate);
         return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });
      recentEnr.sort((a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate));
      setRecentEnrollments(recentEnr.slice(0, 5));


      // 3. Process Level Data (Dynamic)
      if (students.length > 0) {
        const levelCounts = {};
        students.forEach(s => {
           const lvl = getSkillLevelLabel(s.skillLevel);
           levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
        });

        const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#eab308', '#ef4444', '#6366f1'];

        const newLevelData = Object.keys(levelCounts).map((key, index) => ({
            name: `${key} (${Math.round((levelCounts[key] / students.length) * 100)}%)`,
            value: levelCounts[key],
            fill: COLORS[index % COLORS.length]
        }));
        
        setLevelData(newLevelData);
      } else {
        setLevelData([]);
      }

      // 5. Finance Stats & Chart via Service
      const financeStatsRes = await financeService.getFinanceStats();
      if (financeStatsRes.success && financeStatsRes.data.length > 0) {
          setTotalRevenue(financeStatsRes.data[0].value);
          setRevenueGrowth(financeStatsRes.data[0].change);
      }

      const financeChartRes = await financeService.getFinanceChart();
      if (financeChartRes.success) {
          const mappedChartData = financeChartRes.data.map(item => ({
              name: item.name,
              value: item.income
          }));
          setRevenueData(mappedChartData);
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Stat Cards Data
  const stats = [
    {
      label: "Tổng số học viên",
      value: totalStudents.toString(),
      change: studentGrowth,
      type: studentGrowth.includes('-') ? "decrease" : (studentGrowth === '0%' || studentGrowth === '+0%') ? "neutral" : "increase",
      icon: Users,
      color: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
        label: "Học viên mới (Tháng này)",
        value: newEnrollmentsCount.toString(),
        change: enrollmentGrowth,
        type: enrollmentGrowth.includes('-') ? "decrease" : "increase",
        icon: UserPlus,
        color: "bg-purple-50",
        iconColor: "text-purple-600",
    },
    {
      label: "Doanh thu tháng",
      value: totalRevenue > 0 ? `${(totalRevenue / 1000000).toFixed(1)}M` : "0",
      change: revenueGrowth,
      type: revenueGrowth.includes('-') ? "decrease" : (revenueGrowth === '0%' || revenueGrowth === '+0%') ? "neutral" : "increase",
      icon: DollarSign,
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
        label: "Hoạt động",
        value: "Ổn định",
        change: "+95%",
        type: "increase",
        icon: Activity,
        color: "bg-orange-50",
        iconColor: "text-orange-600",
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan trung tâm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chào mừng quay trở lại, đây là tình hình hoạt động hôm nay.
          </p>
        </div>
        <div className="flex bg-gray-50 p-1 rounded-lg">
           <button className="px-4 py-1.5 bg-white text-sm font-medium text-gray-900 shadow-sm rounded-md">Hôm nay</button>
           <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Tháng này</button>
           <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Năm nay</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300" key={index}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color} ${stat.iconColor}`}>
                <stat.icon size={22} strokeWidth={2} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full 
                ${stat.type === 'increase' ? 'bg-green-50 text-green-600' : stat.type === 'decrease' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                {stat.type === 'increase' ? <TrendingUp size={12} /> : stat.type === 'decrease' ? <TrendingDown size={12} /> : null}
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Doanh thu 6 tháng gần nhất</h3>
            <div className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">6 tháng qua</div>
          </div>
          <div ref={revenueChartRef} className="h-[300px] w-full min-w-0 min-h-[300px]">
            {revenueChartWidth > 0 ? (
              <ResponsiveContainer width={Math.max(revenueChartWidth, 10)} height={300}>
                <BarChart data={revenueData} barSize={40} barGap={8}>
                  <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9ca3af', fontSize: 12}}
                      dy={10}
                  />
                  <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9ca3af', fontSize: 12}}
                      tickFormatter={(value) => `${value/1000000}M`}
                  />
                  <Tooltip 
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                    {revenueData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === revenueData.length - 1 ? "#3b82f6" : "#e5e7eb"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
        </div>

        {/* Level Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Phân bổ trình độ</h3>
          </div>
          <div ref={levelChartRef} className="flex-1 flex flex-col justify-center items-center relative min-h-[250px] min-w-0">
              {levelChartWidth > 0 ? (
                <ResponsiveContainer width={Math.max(levelChartWidth, 10)} height={220}>
                  <PieChart>
                    <Pie
                      data={levelData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {levelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] w-full" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
                <div className="text-sm font-medium text-gray-400">Học viên</div>
              </div>
          </div>
          <div className="mt-6 space-y-3">
              {levelData.slice(0, 4).map((item, index) => (
                <div className="flex items-center justify-between text-sm" key={index}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }}></span>
                    <span className="text-gray-600 font-medium">{item.name.split('(')[0]}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
