// components/HomeProducts.js
'use client';
import React, { useEffect } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";

const HomeProducts = ({ searchKeyword = "" }) => {
  const { products, fetchProductData, router } = useAppContext();

  // Refetch products when an order is placed
  useEffect(() => {
    console.log("⏳ HomeProducts mounting:", new Date().toISOString());
    const handleOrderPlaced = () => {
      console.log("⏳ HomeProducts refetching products:", new Date().toISOString());
      fetchProductData();
    };
    window.addEventListener("orderPlaced", handleOrderPlaced);
    return () => window.removeEventListener("orderPlaced", handleOrderPlaced);
  }, [fetchProductData]);

  // Filter products based on searchKeyword
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  console.log("📋 Filtered products:", filteredProducts.length);

  return (
    <div className="flex flex-col items-center pt-14 w-full">
      <p className="text-2xl font-medium text-left w-full">Popular products</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <p className="text-gray-500 col-span-full mt-4">No products found.</p>
        )}
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