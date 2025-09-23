import connectDB from "@/config/db";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" });
        }

        await connectDB();

        // Debug: Check what's in the database
        const rawOrders = await Order.find({ userId });
        console.log("Raw orders from DB:", JSON.stringify(rawOrders, null, 2));

        // Try different populate approaches
        const orders = await Order.find({ userId })
            .populate('address')
            .populate('items.product')
            .sort({ date: -1 });

        console.log("Populated orders:", JSON.stringify(orders, null, 2));

        return NextResponse.json({ success: true, orders });

    } catch (error) {
        console.error("Order fetch error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}