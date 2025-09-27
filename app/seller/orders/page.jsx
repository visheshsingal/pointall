'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const Orders = () => {
    const { currency, getToken, user } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [cancellingOrder, setCancellingOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [refundingOrder, setRefundingOrder] = useState(null);
    const [refundReason, setRefundReason] = useState("");
    
    // Sales report states
    const [salesReport, setSalesReport] = useState({
        totalSales: 0,
        paidOrders: 0,
        pendingOrders: 0,
        monthlyData: [],
        dailyData: []
    });
    const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month, custom
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [showSalesReport, setShowSalesReport] = useState(false);

    const statusOptions = [
        { value: "Order Placed", label: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
        { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
        { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800" },
        { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
        { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" }
    ];

    const paymentOptions = [
        { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
        { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
        { value: "refunded", label: "Refunded", color: "bg-orange-100 text-orange-800" }
    ];

    const dateFilterOptions = [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "custom", label: "Custom Date Range" }
    ];

    const fetchSellerOrders = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            console.log("Fetching orders with token");

            const { data } = await axios.get('/api/order/seller-orders', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000
            });

            if (data.success) {
                const ordersData = Array.isArray(data.orders) ? data.orders : [];
                setOrders(ordersData);
                generateSalesReport(ordersData);
            } else {
                toast.error(data.message || "Failed to fetch orders");
                setOrders([]);
                setSalesReport({
                    totalSales: 0,
                    paidOrders: 0,
                    pendingOrders: 0,
                    monthlyData: [],
                    dailyData: []
                });
            }
        } catch (error) {
            console.error("Fetch error:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            toast.error(error.response?.data?.message || "Failed to fetch orders");
            setOrders([]);
            setSalesReport({
                totalSales: 0,
                paidOrders: 0,
                pendingOrders: 0,
                monthlyData: [],
                dailyData: []
            });
        } finally {
            setLoading(false);
        }
    };

    // Generate sales report from orders data
    const generateSalesReport = (ordersData) => {
        if (!ordersData || ordersData.length === 0) {
            setSalesReport({
                totalSales: 0,
                paidOrders: 0,
                pendingOrders: 0,
                monthlyData: [],
                dailyData: []
            });
            return;
        }

        const now = new Date();
        const filteredOrders = filterOrdersByDate(ordersData, dateFilter, customStartDate, customEndDate);

        // Basic statistics
        const totalSales = filteredOrders
            .filter(order => order.paymentStatus === 'paid' || order.paymentStatus === 'refunded')
            .reduce((sum, order) => sum + (order.amount || 0), 0);

        const paidOrders = filteredOrders.filter(order => order.paymentStatus === 'paid').length;
        const pendingOrders = filteredOrders.filter(order => order.paymentStatus === 'pending').length;

        // Monthly data
        const monthlyData = generateMonthlyData(filteredOrders);
        
        // Daily data (last 30 days)
        const dailyData = generateDailyData(filteredOrders);

        setSalesReport({
            totalSales,
            paidOrders,
            pendingOrders,
            monthlyData,
            dailyData
        });
    };

    // Filter orders based on date filter
    const filterOrdersByDate = (ordersData, filter, startDate, endDate) => {
        const now = new Date();
        
        switch (filter) {
            case 'today':
                return ordersData.filter(order => {
                    const orderDate = new Date(order.date);
                    return orderDate.toDateString() === now.toDateString();
                });
                
            case 'week':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                return ordersData.filter(order => new Date(order.date) >= startOfWeek);
                
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return ordersData.filter(order => new Date(order.date) >= startOfMonth);
                
            case 'custom':
                if (!startDate || !endDate) return ordersData;
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                return ordersData.filter(order => {
                    const orderDate = new Date(order.date);
                    return orderDate >= start && orderDate <= end;
                });
                
            default:
                return ordersData;
        }
    };

    // Generate monthly sales data
    const generateMonthlyData = (ordersData) => {
        const monthlySales = {};
        
        ordersData.forEach(order => {
            if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
                const date = new Date(order.date);
                const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                
                if (!monthlySales[monthYear]) {
                    monthlySales[monthYear] = 0;
                }
                monthlySales[monthYear] += order.amount || 0;
            }
        });

        return Object.entries(monthlySales)
            .map(([month, sales]) => ({ month, sales }))
            .sort((a, b) => a.month.localeCompare(b.month));
    };

    // Generate daily sales data for last 30 days
    const generateDailyData = (ordersData) => {
        const dailySales = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        ordersData.forEach(order => {
            if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
                const orderDate = new Date(order.date);
                if (orderDate >= thirtyDaysAgo) {
                    const dateStr = orderDate.toISOString().split('T')[0];
                    
                    if (!dailySales[dateStr]) {
                        dailySales[dateStr] = 0;
                    }
                    dailySales[dateStr] += order.amount || 0;
                }
            }
        });

        // Fill in missing days with 0 sales
        const result = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            result.push({
                date: dateStr,
                sales: dailySales[dateStr] || 0
            });
        }

        return result;
    };

    // Apply date filter
    const applyDateFilter = () => {
        generateSalesReport(orders);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = await getToken();
            
            const { data } = await axios.put('/api/order/seller-orders', {
                orderId: orderId,
                status: newStatus
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                }
            });

            if (data.success) {
                const updatedOrders = orders.map(order => 
                    order._id === orderId ? data.order : order
                );
                setOrders(updatedOrders);
                generateSalesReport(updatedOrders);
                toast.success(`Order status updated to ${newStatus}`);
            } else {
                toast.error(data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error(error.response?.data?.message || "Failed to update order status");
        }
    };

    const updatePaymentStatus = async (orderId, newPaymentStatus) => {
        try {
            const token = await getToken();
            
            const { data } = await axios.put('/api/order/seller-orders', {
                orderId: orderId,
                paymentStatus: newPaymentStatus
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                }
            });

            if (data.success) {
                const updatedOrders = orders.map(order => 
                    order._id === orderId ? data.order : order
                );
                setOrders(updatedOrders);
                generateSalesReport(updatedOrders);
                toast.success(`Payment status updated to ${newPaymentStatus}`);
            } else {
                toast.error(data.message || "Failed to update payment status");
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            toast.error(error.response?.data?.message || "Failed to update payment status");
        }
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            toast.error("Please select a cancellation reason");
            return;
        }

        try {
            const token = await getToken();
            
            const { data } = await axios.put('/api/order/seller-orders', {
                orderId: cancellingOrder,
                status: "cancelled",
                cancellationReason: cancelReason
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                }
            });

            if (data.success) {
                const updatedOrders = orders.map(order => 
                    order._id === cancellingOrder ? data.order : order
                );
                setOrders(updatedOrders);
                generateSalesReport(updatedOrders);
                toast.success("Order cancelled successfully!");
                setCancellingOrder(null);
                setCancelReason("");
            } else {
                toast.error(data.message || "Failed to cancel order");
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
            toast.error(error.response?.data?.message || "Failed to cancel order");
        }
    };

    const handleRefund = async () => {
        if (!refundReason.trim()) {
            toast.error("Please select a refund reason");
            return;
        }

        try {
            const token = await getToken();
            
            const { data } = await axios.put('/api/order/seller-orders', {
                orderId: refundingOrder,
                paymentStatus: "refunded",
                refundReason: refundReason
            }, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                }
            });

            if (data.success) {
                const updatedOrders = orders.map(order => 
                    order._id === refundingOrder ? data.order : order
                );
                setOrders(updatedOrders);
                generateSalesReport(updatedOrders);
                toast.success("Order refunded successfully!");
                setRefundingOrder(null);
                setRefundReason("");
            } else {
                toast.error(data.message || "Failed to refund order");
            }
        } catch (error) {
            console.error("Error refunding order:", error);
            toast.error(error.response?.data?.message || "Failed to refund order");
        }
    };

    const filteredOrders = orders.filter(order => {
        if (!order) return false;
        
        const matchesSearch = searchTerm ? 
            (order.items?.some(item => 
                item?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            ) || 
            order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
            : true;
        
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    useEffect(() => {
        if (orders.length > 0) {
            generateSalesReport(orders);
        }
    }, [dateFilter, customStartDate, customEndDate]);

    const formatOrderId = (order) => {
        if (!order?._id) return "N/A";
        return `#${order._id.slice(-8).toUpperCase()}`;
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        try {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    const formatTime = (date) => {
        if (!date) return "";
        try {
            return new Date(date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return "";
        }
    };

    const getTotalItems = (order) => {
        if (!order?.items) return 0;
        return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
    };

    const getImageSrc = (item) => {
        if (!item?.product?.image?.[0]) return assets.box_icon;
        return item.product.image[0];
    };

    const formatShippingAddress = (address) => {
        if (!address) return "N/A";
        const { addressLine1, city, state, pincode, country } = address;
        const formattedAddress = `${addressLine1 || ""}, ${city || ""}, ${state || ""} ${pincode || ""}${country ? ", " + country : ""}`.trim();
        return formattedAddress || "N/A";
    };

    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between">
            {loading ? <Loading /> : (
                <div className="md:p-10 p-4 space-y-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-2xl font-bold">Order Management</h2>
                        <button
                            onClick={() => setShowSalesReport(!showSalesReport)}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                        >
                            {showSalesReport ? "Hide Sales Report" : "Show Sales Report"}
                        </button>
                    </div>
                    
                    {/* Sales Report Section */}
                    {showSalesReport && (
                        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-bold mb-4">Sales Analytics Report</h3>
                            
                            {/* Date Filter */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    {dateFilterOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                
                                {dateFilter === 'custom' && (
                                    <>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                        <button
                                            onClick={applyDateFilter}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            Apply Filter
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            {/* Sales Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-blue-600 font-semibold">Total Sales</p>
                                    <p className="text-2xl font-bold">{currency}{salesReport.totalSales.toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">Completed orders</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-green-600 font-semibold">Paid Orders</p>
                                    <p className="text-2xl font-bold">{salesReport.paidOrders}</p>
                                    <p className="text-sm text-gray-600">Successful payments</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-yellow-600 font-semibold">Pending Payments</p>
                                    <p className="text-2xl font-bold">{salesReport.pendingOrders}</p>
                                    <p className="text-sm text-gray-600">Awaiting payment</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-purple-600 font-semibold">Total Orders</p>
                                    <p className="text-2xl font-bold">
                                        {filterOrdersByDate(orders, dateFilter, customStartDate, customEndDate).length}
                                    </p>
                                    <p className="text-sm text-gray-600">All orders</p>
                                </div>
                            </div>
                            
                            {/* Monthly Report */}
                            <div className="mb-6">
                                <h4 className="font-semibold mb-3">Monthly Sales</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {salesReport.monthlyData.slice(-6).map((monthData, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                            <p className="font-medium">{monthData.month}</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {currency}{monthData.sales.toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Recent Daily Sales */}
                            <div>
                                <h4 className="font-semibold mb-3">Recent Daily Sales (Last 7 Days)</h4>
                                <div className="space-y-2">
                                    {salesReport.dailyData.slice(-7).map((dayData, index) => (
                                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span>{formatDate(dayData.date)}</span>
                                            <span className="font-semibold">{currency}{dayData.sales.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search by order ID, product name, customer name, or phone number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
                            />
                            <Image
                                src={assets.search_icon}
                                alt="Search"
                                className="absolute left-3 top-2.5 h-5 w-5"
                                width={20}
                                height={20}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="all">All Status</option>
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Orders Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-blue-600 font-semibold">Total Orders</p>
                            <p className="text-2xl font-bold">{orders.length}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-yellow-600 font-semibold">Pending</p>
                            <p className="text-2xl font-bold">
                                {orders.filter(order => order?.status === 'Order Placed' || order?.status === 'pending').length}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-green-600 font-semibold">Delivered</p>
                            <p className="text-2xl font-bold">
                                {orders.filter(order => order?.status === 'delivered').length}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-red-600 font-semibold">Cancelled</p>
                            <p className="text-2xl font-bold">
                                {orders.filter(order => order?.status === 'cancelled').length}
                            </p>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">
                                    {orders.length === 0 ? "No orders found" : "No orders match your filters"}
                                </p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div key={order._id} className="border border-gray-300 rounded-lg p-4">
                                    {/* Order Header */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                        <div>
                                            <p className="font-semibold">Order {formatOrderId(order)}</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(order.date)}
                                            </p>
                                            <p className="text-sm text-gray-600">Customer ID: {order.userId?.slice(-8) || "N/A"}</p>
                                        </div>
                                        <div className="flex gap-2 mt-2 md:mt-0">
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                statusOptions.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {statusOptions.find(s => s.value === order.status)?.label || order.status}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                paymentOptions.find(s => s.value === order.paymentStatus)?.color || 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {paymentOptions.find(s => s.value === order.paymentStatus)?.label || order.paymentStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Update Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Order Status</label>
                                            <div className="flex flex-wrap gap-2">
                                                {statusOptions.map((status) => {
                                                    console.log(`Rendering status button: ${status.value}`);
                                                    return (
                                                        <button
                                                            key={status.value}
                                                            onClick={() => {
                                                                if (status.value === "cancelled") {
                                                                    setCancellingOrder(order._id);
                                                                } else {
                                                                    updateOrderStatus(order._id, status.value);
                                                                }
                                                            }}
                                                            disabled={order.status === status.value}
                                                            className={`px-3 py-2 rounded text-sm border ${
                                                                order.status === status.value 
                                                                    ? `${status.color} border-current font-bold` 
                                                                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {status.label}
                                                        </button>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => setCancellingOrder(order._id)}
                                                    disabled={order.status === "cancelled"}
                                                    className={`px-3 py-2 rounded text-sm border ${
                                                        order.status === "cancelled"
                                                            ? 'bg-red-100 text-red-800 border-current font-bold'
                                                            : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                                    }`}
                                                >
                                                    Cancel Order
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Payment Status</label>
                                            <div className="flex flex-wrap gap-2">
                                                {paymentOptions.map((payment) => (
                                                    <button
                                                        key={payment.value}
                                                        onClick={() => {
                                                            if (payment.value === "refunded") {
                                                                setRefundingOrder(order._id);
                                                            } else {
                                                                updatePaymentStatus(order._id, payment.value);
                                                            }
                                                        }}
                                                        disabled={order.paymentStatus === payment.value}
                                                        className={`px-3 py-2 rounded text-sm border ${
                                                            order.paymentStatus === payment.value 
                                                                ? `${payment.color} border-current font-bold` 
                                                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {payment.label}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setRefundingOrder(order._id)}
                                                    disabled={order.paymentStatus === "refunded"}
                                                    className={`px-3 py-2 rounded text-sm border ${
                                                        order.paymentStatus === "refunded"
                                                            ? 'bg-orange-100 text-orange-800 border-current font-bold'
                                                            : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                                                    }`}
                                                >
                                                    Refund Payment
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <h4 className="font-medium mb-2">Products ({order.items?.length || 0})</h4>
                                            {order.items?.map((item, index) => (
                                                <div key={index} className="flex gap-2 mb-3 p-2 bg-gray-50 rounded">
                                                    <Image
                                                        src={getImageSrc(item)}
                                                        alt={item.product?.name || "Product"}
                                                        width={50}
                                                        height={50}
                                                        className="rounded object-cover"
                                                        onError={(e) => {
                                                            e.target.src = assets.box_icon;
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium">{item.product?.name || "Product"}</p>
                                                        <p className="text-gray-600">Qty: {item.quantity || 0}</p>
                                                        <p className="text-gray-600">Price: {currency}{item.product?.offerPrice || 0}</p>
                                                        <p className="font-semibold">Subtotal: {currency}{(item.quantity || 0) * (item.product?.offerPrice || 0)}</p>
                                                    </div>
                                                </div>
                                            )) || <p className="text-gray-500">No items</p>}
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Order Information</h4>
                                            <div className="space-y-2 p-2 bg-gray-50 rounded">
                                                <p><strong>Order Total:</strong> {currency}{order.amount || 0}</p>
                                                <p><strong>Total Items:</strong> {getTotalItems(order)}</p>
                                                <p><strong>Order Date:</strong> {formatDate(order.date)}</p>
                                                <p><strong>Customer ID:</strong> {order.userId?.slice(-8) || "N/A"}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Customer Information</h4>
                                            <div className="space-y-2 p-2 bg-gray-50 rounded">
                                                <p><strong>Name:</strong> {order.customer?.fullName || "N/A"}</p>
                                                <p><strong>Phone Number:</strong> {order.customer?.phoneNumber || "N/A"}</p>
                                                <p><strong>Shipping Address:</strong> {formatShippingAddress(order.customer?.shippingAddress)}</p>
                                                {order.customer?.fullName === "N/A" && order.customer?.phoneNumber === "N/A" && formatShippingAddress(order.customer?.shippingAddress) === "N/A" && (
                                                    <p className="text-red-600 text-xs">Customer data unavailable. Contact support.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {order.cancellationReason && (
                                        <div className="mt-3 p-3 bg-red-50 rounded text-sm">
                                            <strong>Cancellation Reason:</strong> {order.cancellationReason}
                                        </div>
                                    )}

                                    {order.refundReason && (
                                        <div className="mt-3 p-3 bg-orange-50 rounded text-sm">
                                            <strong>Refund Reason:</strong> {order.refundReason}<br />
                                            <strong>Refunded on:</strong> {formatDate(order.refundDate)} at {formatTime(order.refundDate)}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Order Modal */}
            {cancellingOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
                        <div className="space-y-2 mb-4">
                            {["Product unavailable", "Customer request", "Address issue", "Other"].map((reason) => (
                                <label key={reason} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={cancelReason === reason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="text-orange-600"
                                    />
                                    <span>{reason}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelOrder}
                                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => {
                                    setCancellingOrder(null);
                                    setCancelReason("");
                                }}
                                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Order Modal */}
            {refundingOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Refund Payment</h3>
                        <div className="space-y-2 mb-4">
                            {["Product defective", "Wrong item", "Customer request", "Other"].map((reason) => (
                                <label key={reason} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="refundReason"
                                        value={reason}
                                        checked={refundReason === reason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="text-orange-600"
                                    />
                                    <span>{reason}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRefund}
                                className="flex-1 bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => {
                                    setRefundingOrder(null);
                                    setRefundReason("");
                                }}
                                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Orders;