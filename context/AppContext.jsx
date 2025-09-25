// context/AppContext.js
'use client';
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = (props) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [userData, setUserData] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [cartItems, setCartItems] = useState({});

  const fetchProductData = async () => {
    try {
      console.log("⏳ Fetching products:", new Date().toISOString());
      const { data } = await axios.get('/api/product/list', {
        headers: { "Cache-Control": "no-store" },
        cache: 'no-store'
      });
      if (data.success) {
        setProducts([...data.products]); // ✅ FIXED: Added spread operator
        console.log("✅ Products updated:", data.products.length);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Product fetch error:", error.message);
      toast.error(error.message);
    }
  };

  const orderPlaced = async (orderData) => {
    try {
      console.log("⏳ Placing order:", new Date().toISOString());
      const token = await getToken();
      const { data } = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success('Order placed successfully');
        await fetchProductData(); // Refetch products
        window.dispatchEvent(new Event("orderPlaced")); // Trigger HomeProducts
        return data;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Order creation error:", error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const fetchUserData = async () => {
    try {
      if (user?.publicMetadata.role === 'seller') {
        setIsSeller(true);
      }
      const token = await getToken();
      const { data } = await axios.get('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setUserData(data.user);
        setCartItems(data.user.cartItems || {});
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addToCart = async (itemId) => {
    if (!user) {
      return toast('Please login', { icon: '⚠️' });
    }
    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      cartData[itemId] += 1;
    } else {
      cartData[itemId] = 1;
    }
    setCartItems(cartData);
    if (user) {
      try {
        const token = await getToken();
        await axios.post('/api/cart/update', { cartData }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Item added to cart');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    let cartData = structuredClone(cartItems);
    if (quantity === 0) {
      delete cartData[itemId];
    } else {
      cartData[itemId] = quantity;
    }
    setCartItems(cartData);
    if (user) {
      try {
        const token = await getToken();
        await axios.post('/api/cart/update', { cartData }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cart Updated');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      if (cartItems[items] > 0) {
        totalCount += cartItems[items];
      }
    }
    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (cartItems[items] > 0 && itemInfo) {
        totalAmount += itemInfo.offerPrice * cartItems[items];
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  };

  useEffect(() => {
    fetchProductData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const value = {
    user,
    getToken,
    currency,
    router,
    isSeller,
    setIsSeller,
    userData,
    fetchUserData,
    products,
    fetchProductData,
    cartItems,
    setCartItems,
    addToCart,
    updateCartQuantity,
    getCartCount,
    getCartAmount,
    orderPlaced
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};