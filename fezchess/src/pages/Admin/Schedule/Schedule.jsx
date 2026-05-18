import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calculator, Calendar as CalendarIcon, Clock, Users, Loader2 } from 'lucide-react';
import scheduleService from '../../../services/scheduleService';

const Schedule = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [classSchedules, setClassSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                setLoading(true);
                setError('');
                const schedules = await scheduleService.getAll();
                setClassSchedules(Array.isArray(schedules) ? schedules : []);
            } catch (error) {
                console.error("Failed to fetch students", error);
                setError(error?.response?.data?.message || "Không thể tải dữ liệu lịch học");
            } finally {
                setLoading(false);
            }
        };
        fetchSchedules();
    }, []);

    const normalizeDayValue = (day) => {
        if (typeof day === 'number' && day >= 0 && day <= 6) return day;
        if (typeof day === 'string') {
            const key = day.trim().toUpperCase();
            const map = { CN: 0, T2: 1, T3: 2, T4: 3, T5: 4, T6: 5, T7: 6 };
            if (key in map) return map[key];
            const asNum = Number(key);
            if (Number.isInteger(asNum) && asNum >= 0 && asNum <= 6) return asNum;
        }
        return null;
    };

    // Helper to get days in the current week view
    const getDaysInView = () => {
        const days = [];
        const start = new Date(currentDate);
        const day = start.getDay();
        // Adjust to Monday (1) - Sunday (7) view
        // In JS Date, Sunday is 0. If current day is Sunday (0), we need to go back 6 days to Monday.
        // If current day is Mon (1), we go back 0 days.
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(start.setDate(diff));

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const daysInView = getDaysInView();
    const today = new Date();

    // Helper to check if a student is on a specific day and time
    const getEventsForCell = (day, hour) => {
        const currentDayVal = day.getDay(); // 0-6

        return classSchedules.filter((item) => {
            if (!Array.isArray(item?.scheduleSlots)) return false;
            return item.scheduleSlots.some((slot) => {
                    const slotDay = normalizeDayValue(slot.day);
                    if (slotDay === null || slotDay !== currentDayVal) return false;
                    const [h] = slot.time.split(':').map(Number);
                    return h === hour; 
                });
        });
    };

    // Calculate active hours to display
    const getActiveHours = () => {
        const activeHoursSet = new Set();
        classSchedules.forEach((item) => {
            if (Array.isArray(item?.scheduleSlots)) {
                    item.scheduleSlots.forEach(slot => {
                        if (slot.time) {
                            const [h] = slot.time.split(':').map(Number);
                            if (!isNaN(h)) activeHoursSet.add(h);
                        }
                    });
            }
        });
        const hrs = Array.from(activeHoursSet).sort((a, b) => a - b);
        // Default range if no data or sparse data, ensuring a reasonable calendar view
        if (hrs.length === 0) return [8, 9, 10, 11, 14, 15, 16, 17, 18, 19];
        
        // Fill in gaps to make the calendar look continuous if needed, or just show active hours
        // Let's create a continuous range from min to max hour found, plus some padding?
        // Actually, just showing specific active hours is efficient for sparse schedules.
        // But for a calendar look, continuous is better.
        const min = Math.min(...hrs, 8);
        const max = Math.max(...hrs, 19);
        const continuousHrs = [];
        for(let i=min; i<=max; i++) continuousHrs.push(i);
        return continuousHrs;
    };

    const activeHours = getActiveHours();

    const navigateWeek = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        setCurrentDate(newDate);
    };

    const formatDate = (date) => {
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const getDayName = (date) => {
        const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[date.getDay()];
    };

    const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // 0 = Mon, 6 = Sun

    // Auto-select today when week changes if today is in view
    useEffect(() => {
        const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        const startOfView = daysInView[0];
        const endOfView = daysInView[6];
        const now = new Date();
        
        if (now >= startOfView && now <= endOfView) {
             setSelectedDayIndex(todayIndex);
        } else {
             setSelectedDayIndex(0); // Default to Monday if today not in view
        }
    }, [currentDate]);


    return (
        <div className="min-h-[calc(100dvh-theme(spacing.20))] md:min-h-[calc(100vh-theme(spacing.24))] flex flex-col space-y-3 md:space-y-4">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                     <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CalendarIcon className="text-primary" size={24} />
                            <span className="hidden leading-none md:block">Lịch Học Viên</span>
                            <span className="md:hidden leading-none">Lịch Học</span>
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 hidden md:block">Xem chi tiết lịch học của tất cả học viên</p>
                     </div>
                     <button 
                        onClick={() => {
                            setCurrentDate(new Date());
                            const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                            setSelectedDayIndex(todayIndex);
                        }}
                        className="md:hidden px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                     >
                         Hôm nay
                     </button>
                </div>

                 <div className="flex items-center justify-between bg-gray-50 p-1 rounded-xl border border-gray-200 w-full md:w-auto">
                     <button onClick={() => navigateWeek(-1)} className="p-1.5 md:p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                        <ChevronLeft size={18}/>
                     </button>
                      <h3 className="flex-1 text-center font-semibold text-gray-800 text-sm select-none px-2">
                         {formatDate(daysInView[0])} - {formatDate(daysInView[6])}
                         <span className="text-xs font-normal text-gray-500 ml-1">({daysInView[0].getFullYear()})</span>
                      </h3>
                     <button onClick={() => navigateWeek(1)} className="p-1.5 md:p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                        <ChevronRight size={18}/>
                     </button>
                 </div>
                 
                 <button 
                    onClick={() => setCurrentDate(new Date())}
                    className="hidden md:block px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm active:scale-95"
                 >
                     Hôm nay
                 </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {/* Mobile Day Selector (Horizontal Scroll) */}
            <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-20 flex overflow-x-auto no-scrollbar py-2 px-1">
                {daysInView.map((day, index) => {
                    const isSelected = selectedDayIndex === index;
                    const isToday = day.toDateString() === today.toDateString();
                    return (
                        <button
                            key={index}
                            onClick={() => setSelectedDayIndex(index)}
                            className={`
                                flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 mx-1 rounded-xl transition-all
                                ${isSelected ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' : 'bg-transparent text-gray-600 hover:bg-gray-50'}
                                ${isToday && !isSelected ? 'ring-1 ring-primary/50 bg-primary/5' : ''}
                            `}
                        >
                            <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                {getDayName(day).split(' ')[1] || 'CN'}
                            </span>
                            <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                {day.getDate()}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Mobile Agenda View */}
            <div className="md:hidden flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 pb-24">
                 {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="animate-spin mb-3 text-primary" size={32} />
                        <span className="text-sm">Đang tải lịch học...</span>
                    </div>
                 ) : (
                    <div className="divide-y divide-gray-100 p-4 space-y-4">
                        {activeHours.map((hour) => {
                            const selectedDate = daysInView[selectedDayIndex];
                             const events = getEventsForCell(selectedDate, hour);
                             
                             if (events.length === 0) return null;

                             return (
                                <div key={hour} className="flex gap-4">
                                     <div className="w-14 flex-shrink-0 flex flex-col items-center pt-2">
                                        <span className="text-lg font-bold text-gray-900">{hour}:00</span>
                                        <span className="text-xs text-gray-400">{hour}:45</span>
                                        <div className="h-full w-0.5 bg-gray-100 mt-2 mb-[-1rem]"></div>
                                     </div>
                                     <div className="flex-1 space-y-3 pb-4">
                                         {events.map(item => (
                                             <div key={item.classId} className="bg-white border text-sm border-l-4 border-l-primary/70 border-gray-200 rounded-lg p-3 shadow-sm">
                                                 <div className="font-bold text-gray-800 text-base mb-1">
                                                    {item.className}
                                                 </div>
                                                 <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                                                     <div className="flex items-center gap-1">
                                                        <Users size={12} />
                                                        <span>{item.students?.length || 0} học viên</span>
                                                     </div>
                                                     <div className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        <span>{item.room || "Học tại trung tâm"}</span>
                                                     </div>
                                                 </div>
                                                 {item.teacher && (
                                                     <div className="flex items-center gap-2 bg-blue-50 px-2 py-1.5 rounded-md w-fit">
                                                         <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm">
                                                             GV
                                                         </div>
                                                         <span className="text-xs font-medium text-blue-700">
                                                             {item.teacher.fullName || item.teacher.username}
                                                         </span>
                                                     </div>
                                                 )}
                                             </div>
                                         ))}
                                     </div>
                                </div>
                             )
                        })}
                        
                         {/* Empty State for Day */}
                         {!loading && activeHours.every(h => getEventsForCell(daysInView[selectedDayIndex], h).length === 0) && (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <CalendarIcon className="text-gray-300" size={32} />
                                </div>
                                <h3 className="text-gray-900 font-medium mb-1">Không có lịch học</h3>
                                <p className="text-gray-500 text-sm">Chưa có lớp nào được xếp vào ngày này.</p>
                            </div>
                        )}
                    </div>
                 )}
            </div>

            {/* Desktop Calendar Grid Container */}
            <div className="hidden md:flex flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-col min-h-0">
                {/* Header Row */}
                <div className="flex border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
                     {/* Empty Corner Cell for Time */}
                    <div className="w-20 lg:w-24 flex-shrink-0 border-r border-gray-200 p-4 flex items-center justify-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Giờ
                    </div>
                    
                    {/* Days Headers */}
                    <div className="flex-1 grid grid-cols-7 divide-x divide-gray-200">
                        {daysInView.map((day, index) => {
                            const isToday = day.toDateString() === today.toDateString();
                            return (
                                <div key={index} className={`flex flex-col items-center justify-center py-4 ${isToday ? 'bg-blue-50/50' : ''}`}>
                                    <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isToday ? 'text-primary' : 'text-gray-500'}`}>
                                        {getDayName(day)}
                                    </div>
                                    <div className={`
                                        w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all
                                        ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-gray-700'}
                                    `}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Grid Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="animate-spin mb-3 text-primary" size={32} />
                            <span className="text-sm">Đang tải lịch học...</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {activeHours.map((hour) => (
                                <div key={hour} className="flex min-h-[140px] group">
                                    {/* Time Column */}
                                    <div className="w-20 lg:w-24 flex-shrink-0 border-r border-gray-100 bg-gray-50/30 flex flex-col items-center justify-start py-4 group-hover:bg-gray-50 transition-colors">
                                        <span className="text-sm font-bold text-gray-700 font-mono">{hour}:00</span>
                                        <span className="text-xs text-gray-400 mt-1">{hour}:45</span>
                                    </div>

                                    {/* Cells */}
                                    <div className="flex-1 grid grid-cols-7 divide-x divide-gray-100">
                                        {daysInView.map((day, index) => {
                                            const events = getEventsForCell(day, hour);
                                            const isToday = day.toDateString() === today.toDateString();
                                            
                                            return (
                                                <div 
                                                    key={index} 
                                                    className={`
                                                        p-2 transition-colors relative
                                                        ${isToday ? 'bg-blue-50/10' : 'bg-white'}
                                                        hover:bg-gray-50
                                                    `}
                                                >
                                                    {events.length > 0 ? (
                                                        <div className="flex flex-col gap-2 h-full">
                                                            {events.map(item => (
                                                                <div key={item.classId} className="
                                                                    bg-white border text-[13px] border-l-4 border-l-primary/70 border-gray-200 rounded-r-lg p-2.5 shadow-sm hover:shadow-md transition-all 
                                                                    group/card cursor-pointer hover:-translate-y-0.5
                                                                ">
                                                                    <div className="font-bold text-gray-800 line-clamp-1 group-hover/card:text-primary transition-colors">
                                                                        {item.className}
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                                                                        <Users size={12} />
                                                                        <span className="truncate max-w-[80px]">
                                                                            {item.students?.length || 0} học viên
                                                                        </span>
                                                                    </div>

                                                                    {item.teacher && (
                                                                         <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600/80 font-medium">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                                            <span className="truncate">
                                                                                GV: {item.teacher.fullName || item.teacher.username}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            {/* Placeholder for empty slot interaction if needed */}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                             {/* Empty state if no active hours but loaded */}
                             {!loading && activeHours.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    Không có lịch học nào để hiển thị.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #CBD5E1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94A3B8;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            `}</style>
        </div>
    );
};
export default Schedule;
