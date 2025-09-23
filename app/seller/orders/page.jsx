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

    // Order status options
    const statusOptions = [
        { value: "pending", label: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
        { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
        { value: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-800" },
        { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
        { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" }
    ];

    // Payment status options
    const paymentOptions = [
        { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
        { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" }
    ];

    const fetchSellerOrders = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            
            if (!token) {
                toast.error("Authentication required");
                setLoading(false);
                return;
            }

            console.log('Fetching orders with token...');
            
            // First, try with your actual API endpoint
            const { data } = await axios.get('/api/order/seller-orders', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (data.success) {
                setOrders(data.orders);
                toast.success(`Loaded ${data.orders.length} orders`);
            } else {
                toast.error(data.message);
                // Fallback to mock data if API fails
                loadMockData();
            }
        } catch (error) {
            console.error('API Error:', error);
            if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
                toast.error("Server connection failed - using demo data");
            } else if (error.response?.status === 404) {
                toast.error("API endpoint not found - using demo data");
            } else {
                toast.error("Failed to fetch orders - using demo data");
            }
            // Fallback to mock data
            loadMockData();
        } finally {
            setLoading(false);
        }
    };

    // Mock data fallback
    const loadMockData = () => {
        const mockOrders = [
            {
                _id: 'order_' + Math.random().toString(36).substr(2, 9),
                status: 'pending',
                paymentStatus: 'paid',
                amount: 99.99,
                date: new Date(),
                address: {
                    fullName: 'John Doe',
                    area: 'Downtown',
                    city: 'New York',
                    state: 'NY',
                    phoneNumber: '123-456-7890'
                },
                items: [
                    {
                        quantity: 2,
                        product: {
                            name: 'Wireless Bluetooth Headphones',
                            offerPrice: 49.99,
                            image: [assets.box_icon]
                        }
                    }
                ]
            },
            {
                _id: 'order_' + Math.random().toString(36).substr(2, 9),
                status: 'confirmed',
                paymentStatus: 'paid',
                amount: 149.50,
                date: new Date(Date.now() - 86400000),
                address: {
                    fullName: 'Jane Smith',
                    area: 'Uptown',
                    city: 'Los Angeles',
                    state: 'CA',
                    phoneNumber: '987-654-3210'
                },
                items: [
                    {
                        quantity: 1,
                        product: {
                            name: 'Smart Watch',
                            offerPrice: 149.50,
                            image: [assets.box_icon]
                        }
                    }
                ]
            },
            {
                _id: 'order_' + Math.random().toString(36).substr(2, 9),
                status: 'shipped',
                paymentStatus: 'paid',
                amount: 75.25,
                date: new Date(Date.now() - 172800000),
                address: {
                    fullName: 'Mike Johnson',
                    area: 'Midtown',
                    city: 'Chicago',
                    state: 'IL',
                    phoneNumber: '555-123-4567'
                },
                items: [
                    {
                        quantity: 3,
                        product: {
                            name: 'Phone Case',
                            offerPrice: 25.08,
                            image: [assets.box_icon]
                        }
                    }
                ]
            },
            {
                _id: 'order_' + Math.random().toString(36).substr(2, 9),
                status: 'delivered',
                paymentStatus: 'paid',
                amount: 199.99,
                date: new Date(Date.now() - 259200000),
                address: {
                    fullName: 'Sarah Wilson',
                    area: 'Suburb',
                    city: 'Houston',
                    state: 'TX',
                    phoneNumber: '444-555-6666'
                },
                items: [
                    {
                        quantity: 1,
                        product: {
                            name: 'Tablet Stand',
                            offerPrice: 199.99,
                            image: [assets.box_icon]
                        }
                    }
                ]
            }
        ];
        setOrders(mockOrders);
    };

    // Update order status
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = await getToken();
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Update locally first for better UX
            setOrders(prev => prev.map(order => 
                order._id === orderId ? { ...order, status: newStatus } : order
            ));
            
            // Try to update on server
            if (token) {
                const { data } = await axios.put('/api/order/seller-orders', {
                    orderId: orderId,
                    status: newStatus
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                });

                if (data.success) {
                    toast.success(`Order status updated to ${newStatus}`);
                }
            } else {
                toast.success(`Order status updated to ${newStatus} (local)`);
            }
        } catch (error) {
            console.error('Update status error:', error);
            toast.success(`Order status updated to ${newStatus} (local - server update failed)`);
        }
    };

    // Update payment status
    const updatePaymentStatus = async (orderId, newPaymentStatus) => {
        try {
            const token = await getToken();
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Update locally first
            setOrders(prev => prev.map(order => 
                order._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
            ));
            
            // Try to update on server
            if (token) {
                const { data } = await axios.put('/api/order/seller-orders', {
                    orderId: orderId,
                    paymentStatus: newPaymentStatus
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                });

                if (data.success) {
                    toast.success(`Payment status updated to ${newPaymentStatus}`);
                }
            } else {
                toast.success(`Payment status updated to ${newPaymentStatus} (local)`);
            }
        } catch (error) {
            console.error('Update payment status error:', error);
            toast.success(`Payment status updated to ${newPaymentStatus} (local - server update failed)`);
        }
    };

    // Cancel order
    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            toast.error("Please select a cancellation reason");
            return;
        }

        try {
            const token = await getToken();
            
            // Update locally first
            setOrders(prev => prev.map(order => 
                order._id === cancellingOrder ? { 
                    ...order, 
                    status: "cancelled", 
                    cancellationReason: cancelReason 
                } : order
            ));
            
            // Try to update on server
            if (token) {
                const { data } = await axios.put('/api/order/seller-orders', {
                    orderId: cancellingOrder,
                    status: "cancelled",
                    cancellationReason: cancelReason
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                });

                if (data.success) {
                    toast.success("Order cancelled successfully!");
                }
            } else {
                toast.success("Order cancelled successfully! (local)");
            }
            
            setCancellingOrder(null);
            setCancelReason("");
        } catch (error) {
            console.error('Cancel order error:', error);
            toast.success("Order cancelled successfully! (local - server update failed)");
            setCancellingOrder(null);
            setCancelReason("");
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch = searchTerm ? 
            order.items.some(item => 
                item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            ) || 
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.address?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        if (user) {
            fetchSellerOrders();
        }
    }, [user]);

    return (
        <div className="flex-1 min-h-screen flex flex-col justify-between bg-gray-50">
            {loading ? <Loading /> : (
                <div className="md:p-8 p-4 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
                        <p className="text-gray-600 mt-1">Manage your customer orders efficiently</p>
                    </div>
                    
                    {/* Search and Filter */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search by order ID, product name, or customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <Image
                                    src={assets.search_icon}
                                    alt="Search"
                                    className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                                    width={20}
                                    height={20}
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[180px]"
                            >
                                <option value="all">All Status</option>
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Orders Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                            <div className="text-gray-600 text-sm">Total Orders</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {orders.filter(o => o.status === 'pending').length}
                            </div>
                            <div className="text-gray-600 text-sm">Pending</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {orders.filter(o => o.status === 'delivered').length}
                            </div>
                            <div className="text-gray-600 text-sm">Delivered</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {orders.filter(o => o.status === 'cancelled').length}
                            </div>
                            <div className="text-gray-600 text-sm">Cancelled</div>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                        {filteredOrders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                                <div className="text-gray-400 text-6xl mb-4">📦</div>
                                <p className="text-gray-500 text-lg">No orders found</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {searchTerm || filterStatus !== "all" 
                                        ? "Try adjusting your search or filter criteria" 
                                        : "You don't have any orders yet"
                                    }
                                </p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Order Header */}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(order.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 mt-2 md:mt-0">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusOptions.find(s => s.value === order.status)?.color}`}>
                                                    {statusOptions.find(s => s.value === order.status)?.label}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentOptions.find(s => s.value === order.paymentStatus)?.color}`}>
                                                    {paymentOptions.find(s => s.value === order.paymentStatus)?.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {/* Status Update Section */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Order Status</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {statusOptions.map((status) => (
                                                        <button
                                                            key={status.value}
                                                            onClick={() => updateOrderStatus(order._id, status.value)}
                                                            disabled={order.status === status.value}
                                                            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                                                                order.status === status.value 
                                                                    ? `${status.color} border-2 border-current cursor-default` 
                                                                    : 'bg-gray-100 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 active:scale-95'
                                                            }`}
                                                        >
                                                            {status.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">Payment Status</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {paymentOptions.map((payment) => (
                                                        <button
                                                            key={payment.value}
                                                            onClick={() => updatePaymentStatus(order._id, payment.value)}
                                                            disabled={order.paymentStatus === payment.value}
                                                            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
                                                                order.paymentStatus === payment.value 
                                                                    ? `${payment.color} border-2 border-current cursor-default` 
                                                                    : 'bg-gray-100 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 active:scale-95'
                                                            }`}
                                                        >
                                                            {payment.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-3">Products</h4>
                                                <div className="space-y-3">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex gap-3 items-start">
                                                            <div className="flex-shrink-0">
                                                                <Image
                                                                    src={item.product?.image?.[0] || assets.box_icon}
                                                                    alt={item.product?.name || "Product"}
                                                                    width={50}
                                                                    height={50}
                                                                    className="rounded-lg border border-gray-200"
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-gray-800 truncate">{item.product?.name || "Product"}</p>
                                                                <p className="text-gray-600">Qty: {item.quantity}</p>
                                                                <p className="text-gray-600">Price: {currency}{item.product?.offerPrice?.toFixed(2) || '0.00'}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-3">Customer Details</h4>
                                                <div className="space-y-2">
                                                    <p className="font-medium text-gray-800">{order.address?.fullName || "N/A"}</p>
                                                    <p className="text-gray-600">{order.address?.area || ""}</p>
                                                    <p className="text-gray-600">{order.address?.city || ""}, {order.address?.state || ""}</p>
                                                    <p className="text-gray-600">{order.address?.phoneNumber || ""}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-gray-700 mb-3">Order Summary</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Subtotal:</span>
                                                        <span className="font-medium">{currency}{order.amount?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Items:</span>
                                                        <span className="font-medium">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                                                        <span className="text-gray-800 font-medium">Total:</span>
                                                        <span className="text-lg font-bold text-orange-600">{currency}{order.amount?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                    {order.status !== "cancelled" && order.status !== "delivered" && (
                                                        <button
                                                            onClick={() => setCancellingOrder(order._id)}
                                                            className="w-full mt-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors duration-200"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {order.cancellationReason && (
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <strong className="text-red-800 text-sm">Cancellation Reason:</strong>
                                                <p className="text-red-700 text-sm mt-1">{order.cancellationReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Order Modal */}
            {cancellingOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cancel Order</h3>
                        <p className="text-gray-600 mb-4">Please select a reason for cancellation:</p>
                        
                        <div className="space-y-3 mb-6">
                            {["Product unavailable", "Customer request", "Address issue", "Payment issue", "Other"].map((reason) => (
                                <label key={reason} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={cancelReason === reason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        className="text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-gray-700">{reason}</span>
                                </label>
                            ))}
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelOrder}
                                disabled={!cancelReason}
                                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors duration-200 ${
                                    cancelReason 
                                        ? 'bg-red-600 text-white hover:bg-red-700' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Confirm Cancellation
                            </button>
                            <button
                                onClick={() => {
                                    setCancellingOrder(null);
                                    setCancelReason("");
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
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