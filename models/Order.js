import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        ref: 'user' 
    },
    items: [{
        product: { 
            type: mongoose.Schema.Types.ObjectId,
            required: true, 
            ref: 'product' 
        },
        quantity: { 
            type: Number, 
            required: true 
        }
    }],
    amount: { 
        type: Number, 
        required: true 
    },
    address: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'address', 
        required: true 
    },
    status: { 
        type: String, 
        required: true, 
        default: 'Order Placed',
        enum: ['Order Placed', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    },
    paymentStatus: {
        type: String,
        required: true,
        default: 'pending',
        enum: ['pending', 'paid', 'failed']
    },
    cancellationReason: {
        type: String
    },
    date: { 
        type: Date,
        default: Date.now 
    },
});

const Order = mongoose.models.order || mongoose.model('order', orderSchema);

export default Order;