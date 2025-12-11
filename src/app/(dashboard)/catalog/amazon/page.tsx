'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  ExternalLink,
  Loader2,
  ShoppingCart,
  AlertCircle,
  Filter,
  Star,
  Package,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { amazonApi, type AmazonProduct } from '@/lib/api';
import type { Product } from '@/types';

// Convert AmazonProduct to Product for cart compatibility
const toProduct = (ap: AmazonProduct): Product => ({
  id: ap.id,
  sku: ap.sku,
  name: ap.name,
  description: ap.description,
  category: ap.category,
  model: ap.asin,
  specification: ap.specification,
  supplier: ap.supplier,
  price: ap.price,
  currency: ap.currency,
  stock: ap.stock,
  stock_status: ap.stock_status as 'in_stock' | 'limited' | 'out_of_stock',
  image_url: ap.image_url,
  source: 'amazon',
  is_active: ap.is_active,
});

export default function AmazonCatalogPage() {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Load products on mount - show catalog immediately
  useEffect(() => {
    loadProducts();
  }, []);

  // Reload when category changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      loadProducts(selectedCategory);
    } else {
      loadProducts();
    }
  }, [selectedCategory]);

  const loadProducts = async (category?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use a general query to get products, filtered by admin rules
      const result = await amazonApi.searchProducts({
        q: category || 'office supplies electronics',
        category: category,
      });
      setProducts(result.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products from Amazon');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const text = {
    en: {
      title: 'Amazon Business Catalog',
      subtitle: 'Browse and order from Amazon Business - filtered by company policy',
      searchPlaceholder: 'Search products...',
      search: 'Search',
      loading: 'Loading catalog...',
      noResults: 'No products found',
      tryDifferent: 'Try a different category or search term',
      addToCart: 'Add to Cart',
      added: 'Added!',
      viewOnAmazon: 'View on Amazon',
      categories: {
        all: 'All Categories',
        electronics: 'Electronics',
        furniture: 'Furniture',
        office: 'Office Supplies',
      },
      filterRulesApplied: 'Company purchasing rules applied',
      priceFiltered: 'Products filtered based on your organization\'s purchasing policies',
      rating: 'Rating',
      prime: 'Prime',
      inStock: 'In Stock',
      productsCount: 'products available',
    },
    zh: {
      title: 'Amazon Business 目录',
      subtitle: '浏览和订购Amazon Business产品 - 已应用公司采购政策',
      searchPlaceholder: '搜索产品...',
      search: '搜索',
      loading: '加载目录中...',
      noResults: '未找到产品',
      tryDifferent: '尝试其他类别或搜索词',
      addToCart: '加入购物车',
      added: '已添加!',
      viewOnAmazon: '在Amazon上查看',
      categories: {
        all: '全部类别',
        electronics: '电子产品',
        furniture: '家具',
        office: '办公用品',
      },
      filterRulesApplied: '已应用公司采购规则',
      priceFiltered: '根据您组织的采购政策筛选产品',
      rating: '评分',
      prime: 'Prime',
      inStock: '有货',
      productsCount: '个产品可用',
    },
    es: {
      title: 'Catálogo Amazon Business',
      subtitle: 'Explore y ordene de Amazon Business - filtrado por políticas de la empresa',
      searchPlaceholder: 'Buscar productos...',
      search: 'Buscar',
      searching: 'Buscando...',
      noResults: 'No se encontraron productos',
      tryDifferent: 'Intente con un término de búsqueda diferente',
      addToCart: 'Agregar al Carrito',
      added: '¡Agregado!',
      viewOnAmazon: 'Ver en Amazon',
      categories: {
        all: 'Todas las Categorías',
        electronics: 'Electrónica',
        furniture: 'Muebles',
        office: 'Suministros de Oficina',
      },
      filterRulesApplied: 'Políticas de compra de la empresa aplicadas',
      priceFiltered: 'Productos filtrados según las políticas de compra de su organización',
      rating: 'Calificación',
      prime: 'Prime',
      inStock: 'En Stock',
      loading: 'Cargando catálogo...',
      productsCount: 'productos disponibles',
    },
  };

  const t = text[language];

  const getProductName = (product: AmazonProduct) => {
    return product.name;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await amazonApi.searchProducts({
        q: searchQuery,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setProducts(result.products || []);
    } catch (err) {
      console.error('Failed to search products:', err);
      setError(err instanceof Error ? err.message : 'Failed to search products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToCart = (product: AmazonProduct) => {
    addToCart(toProduct(product));
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category.toLowerCase() === selectedCategory);

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <section className="border-b border-[#E4E1DD] bg-white px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#E08A4B] to-[#C77A3F] flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
                {t.title}
              </h1>
              <p className="text-base text-[#6E6B67]">{t.subtitle}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E6B67]" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full rounded-lg border border-[#E4E1DD] bg-white py-3 pl-12 pr-4 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#E08A4B] focus:outline-none focus:ring-2 focus:ring-[#E08A4B]/20"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#E08A4B] to-[#C77A3F] px-6 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {t.search}
            </button>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex gap-2">
            {Object.entries(t.categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === key
                    ? 'bg-gradient-to-r from-[#E08A4B] to-[#C77A3F] text-white shadow-md'
                    : 'bg-white text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#F9F8F6]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filter Rules Notice */}
      <section className="px-8 py-3 bg-[#E08A4B]/10 border-b border-[#E08A4B]/20">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-[#E08A4B]" />
            <div>
              <span className="text-sm font-medium text-[#E08A4B]">{t.filterRulesApplied}</span>
              <span className="text-sm text-[#6E6B67] ml-2">{t.priceFiltered}</span>
            </div>
          </div>
          {!isLoading && (
            <span className="text-sm text-[#6E6B67]">
              {filteredProducts.length} {t.productsCount}
            </span>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            // Loading state
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#E08A4B] mx-auto mb-4" />
                <p className="text-[#6E6B67]">{t.loading}</p>
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="rounded-lg bg-red-50 border border-red-200 p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-red-700 mb-2">Failed to load products</p>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => loadProducts()}
                className="rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            // No results
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
              <Package className="h-12 w-12 text-[#E4E1DD] mx-auto mb-4" />
              <p className="text-xl font-semibold text-[#2C2C2C] mb-2">{t.noResults}</p>
              <p className="text-[#6E6B67]">{t.tryDifferent}</p>
            </div>
          ) : (
            // Products Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl bg-white border border-[#E4E1DD] overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  >
                    {/* Product Image */}
                    <div className="h-48 bg-gradient-to-br from-[#F9F8F6] to-[#E4E1DD] flex items-center justify-center relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-6xl">📦</span>
                      )}
                      {product.is_prime && (
                        <Badge className="absolute top-3 right-3 bg-[#E08A4B] text-white border-0">
                          {t.prime}
                        </Badge>
                      )}
                      {product.is_best_seller && (
                        <Badge className="absolute top-3 left-3 bg-[#4BAF7E] text-white border-0">
                          Best Seller
                        </Badge>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-[#2C2C2C] mb-1 line-clamp-2">
                        {getProductName(product)}
                      </h3>
                      <p className="text-sm text-[#6E6B67] mb-2">{product.specification}</p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= product.rating ? 'text-[#E1A948] fill-[#E1A948]' : 'text-[#E4E1DD]'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-[#6E6B67] ml-1">
                          ({product.rating.toFixed(1)}) {product.review_count > 0 && `${product.review_count.toLocaleString()} reviews`}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-[#2C2C2C]">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-[#4BAF7E]">{t.inStock}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 py-2.5 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {t.addToCart}
                        </button>
                        <button className="rounded-lg border border-[#E4E1DD] px-3 py-2.5 text-[#6E6B67] hover:bg-[#F9F8F6] transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
