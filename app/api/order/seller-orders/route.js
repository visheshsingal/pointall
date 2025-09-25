export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address"; // Explicitly import Address
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const user = await currentUser();
        console.log("Fetching user from Clerk:", { userId: user?.id, timestamp: new Date().toISOString() });

        if (!user) {
            console.error("No user found in auth", { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const isSeller = await authSeller(user.id);
        console.log("Seller check result:", { userId: user.id, isSeller, timestamp: new Date().toISOString() });
        if (!isSeller) {
            console.error("User is not a seller:", { userId: user.id, timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        await connectDB();

        // Log model registration
        console.log("Models registered:", {
            Order: !!mongoose.models.Order,
            Product: !!mongoose.models.Product,
            Address: !!mongoose.models.Address,
            timestamp: new Date().toISOString()
        });

        // Get seller's product IDs
        const sellerProductIds = await Product.find({ userId: user.id }).distinct('_id');
        console.log("Seller product IDs:", { count: sellerProductIds.length, timestamp: new Date().toISOString() });

        // Fetch orders containing seller's products
        const sellerOrders = await Order.find({ "items.product": { $in: sellerProductIds } })
            .populate({
                path: 'items.product',
                select: '_id name image offerPrice',
                match: { userId: user.id }
            })
            .populate({
                path: 'address',
                model: 'Address', // Explicitly specify model
                select: 'fullName phoneNumber pincode area city state'
            })
            .lean();

        console.log("Raw orders fetched:", { count: sellerOrders.length, timestamp: new Date().toISOString() });

        // Map orders to include customer object
        const ordersWithCustomer = sellerOrders.map(order => {
            console.log(`Order ${order._id} address:`, JSON.stringify(order.address || {}, null, 2));
            return {
                ...order,
                customer: {
                    fullName: order.address?.fullName || "N/A",
                    phoneNumber: order.address?.phoneNumber || "N/A",
                    shippingAddress: order.address ? {
                        addressLine1: order.address.area || "",
                        city: order.address.city || "",
                        state: order.address.state || "",
                        pincode: order.address.pincode || "",
                        country: ""
                    } : null
                }
            };
        });

        console.log("Orders with customer data:", { count: ordersWithCustomer.length, timestamp: new Date().toISOString() });

        return NextResponse.json({ success: true, orders: ordersWithCustomer });

    } catch (error) {
        console.error("Error fetching seller orders:", {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = await currentUser();
        console.log("Fetching user for PUT:", { userId: user?.id, timestamp: new Date().toISOString() });

        if (!user) {
            console.error("No user found in auth", { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const isSeller = await authSeller(user.id);
        console.log("Seller check result for PUT:", { userId: user.id, isSeller, timestamp: new Date().toISOString() });
        if (!isSeller) {
            console.error("User is not a seller:", { userId: user.id, timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { orderId, status, paymentStatus, cancellationReason } = body;

        if (!orderId) {
            console.error("Missing orderId in request body", { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
        }

        const order = await Order.findById(orderId).populate('items.product').populate({
            path: 'address',
            model: 'Address',
            select: 'fullName phoneNumber pincode area city state'
        });
        if (!order) {
            console.error(`Order not found: ${orderId}`, { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        const hasSellerProducts = order.items.some(item => 
            item.product && item.product.userId === user.id
        );
        console.log(`Order ${orderId} has seller products:`, { hasSellerProducts, timestamp: new Date().toISOString() });

        if (!hasSellerProducts) {
            console.error(`Not authorized to update order ${orderId}`, { timestamp: new Date().toISOString() });
            return NextResponse.json({ success: false, message: 'Not authorized to update this order' }, { status: 403 });
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (cancellationReason) updateData.cancellationReason = cancellationReason;

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        ).populate('items.product').populate({
            path: 'address',
            model: 'Address',
            select: 'fullName phoneNumber pincode area city state'
        }).lean();

        console.log(`Updated order ${updatedOrder._id} address:`, JSON.stringify(updatedOrder.address || {}, null, 2));

        const responseOrder = {
            ...updatedOrder,
            customer: {
                fullName: updatedOrder.address?.fullName || "N/A",
                phoneNumber: updatedOrder.address?.phoneNumber || "N/A",
                shippingAddress: updatedOrder.address ? {
                    addressLine1: updatedOrder.address.area || "",
                    city: updatedOrder.address.city || "",
                    state: updatedOrder.address.state || "",
                    pincode: updatedOrder.address.pincode || "",
                    country: ""
                } : null
            }
        };

        return NextResponse.json({ 
            success: true, 
            message: 'Order updated successfully',
            order: responseOrder
        });

    } catch (error) {
        console.error("Error updating order:", {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}