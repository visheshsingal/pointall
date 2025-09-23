'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";

const MyOrders = () => {
    const { currency, getToken, user } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Status colors for better visual indication
    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-blue-100 text-blue-800",
        shipped: "bg-purple-100 text-purple-800",
        delivered: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800"
    };

    const paymentStatusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        paid: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800"
    };

    const fetchOrders = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/order/list', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setOrders(data.orders.reverse()); // Show newest first
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    // Format status text to be more readable
    const formatStatus = (status) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                        <p className="text-gray-600 mt-2">Track your order status and history</p>
                        <p className="text-gray-600 mt-2">If you wish to cancel your order, please contact us at +91 99909 29900.</p>
                    </div>

                    {loading ? (
                        <Loading />
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                                <Image
                                    src={assets.box_icon}
                                    alt="No orders"
                                    width={80}
                                    height={80}
                                    className="mx-auto mb-4 opacity-50"
                                />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                                <p className="text-gray-500">You haven't placed any orders yet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order, index) => (
                                <div key={order._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Order Header */}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Order #{order._id ? order._id.slice(-8).toUpperCase() : `ORD${index + 1}`}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Placed on {new Date(order.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                    {formatStatus(order.status)}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                    Payment: {formatStatus(order.paymentStatus)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Content */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Products */}
                                            <div className="lg:col-span-2">
                                                <h4 className="font-medium text-gray-900 mb-3">Products</h4>
                                                <div className="space-y-3">
                                                    {order.items.map((item, itemIndex) => (
                                                        <div key={itemIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                            <Image
                                                                src={item.product?.image?.[0] || assets.box_icon}
                                                                alt={item.product?.name || "Product image"}
                                                                width={60}
                                                                height={60}
                                                                className="rounded-lg object-cover flex-shrink-0"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 truncate">
                                                                    {item.product?.name || "Product"}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    Quantity: {item.quantity} × {currency}{item.product?.offerPrice || 0}
                                                                </p>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    Total: {currency}{(item.quantity * (item.product?.offerPrice || 0)).toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Order Summary */}
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <p className="font-medium text-gray-900">{order.address?.fullName}</p>
                                                        <p className="text-sm text-gray-600">{order.address?.area}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {order.address?.city}, {order.address?.state}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{order.address?.phoneNumber}</p>
                                                        {order.address?.email && (
                                                            <p className="text-sm text-gray-600">{order.address.email}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                                                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Subtotal:</span>
                                                            <span className="font-medium">{currency}{order.amount || 0}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Shipping:</span>
                                                            <span className="font-medium">{currency}0.00</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                                                            <span className="text-gray-600">Total:</span>
                                                            <span className="font-semibold text-lg">{currency}{order.amount || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cancellation Reason if applicable */}
                                                {order.cancellationReason && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                        <h5 className="font-medium text-red-800 text-sm mb-1">Cancellation Reason</h5>
                                                        <p className="text-red-700 text-sm">{order.cancellationReason}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;