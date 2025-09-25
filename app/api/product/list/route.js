import connectDB from '@/config/db'
import Product from '@/models/Product'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        await connectDB()

        const products = await Product.find({})
        
        return NextResponse.json(
            { success: true, products },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                    'CDN-Cache-Control': 'no-cache',
                    'Vercel-CDN-Cache-Control': 'no-cache'
                }
            }
        )

    } catch (error) {
        return NextResponse.json(
            { success: false, message: error.message },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                    'CDN-Cache-Control': 'no-cache',
                    'Vercel-CDN-Cache-Control': 'no-cache'
                }
            }
        )
    }
}