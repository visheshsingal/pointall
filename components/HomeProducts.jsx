// components/HomeProducts.js
'use client';
import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";

const HomeProducts = ({ searchKeyword = "" }) => {
  const { products, fetchProductData, router } = useAppContext();
  const [lastFetch, setLastFetch] = useState(Date.now());

  // Refetch products every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refetching products");
      fetchProductData();
      setLastFetch(Date.now());
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [fetchProductData]);

  // Refetch when component mounts and when order is placed
  useEffect(() => {
    console.log("⏳ HomeProducts mounting - fetching products");
    fetchProductData();
    
    const handleOrderPlaced = () => {
      console.log("🔄 Order placed - refetching products");
      fetchProductData();
    };
    
    window.addEventListener("orderPlaced", handleOrderPlaced);
    return () => window.removeEventListener("orderPlaced", handleOrderPlaced);
  }, [fetchProductData]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center pt-14 w-full">
      <div className="flex justify-between items-center w-full mb-2">
        <p className="text-2xl font-medium">Popular products</p>
        <button 
          onClick={() => {
            fetchProductData();
            setLastFetch(Date.now());
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh ↻
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
        {filteredProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
      
      <button
        onClick={() => router.push("/all-products")}
        className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition"
      >
        See more
      </button>
    </div>
  );
};

export default HomeProducts;