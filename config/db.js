// @/config/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in env');
}

let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

async function connectDB() {
    if (cached.conn) {
        console.log("Reusing MongoDB connection");
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            connectTimeoutMS: 30000,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10
        };

        console.log("Connecting to MongoDB...");
        cached.promise = mongoose.connect(`${MONGODB_URI}`, opts)
            .then(mongoose => {
                console.log("MongoDB connected");
                require('@/models/Address');
                require('@/models/Order');
                require('@/models/Product');
                return mongoose;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("MongoDB error:", e.message);
        throw e;
    }

    return cached.conn;
}

export default connectDB;