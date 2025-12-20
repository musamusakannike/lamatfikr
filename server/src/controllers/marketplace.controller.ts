import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import axios from "axios";

import { env } from "../config/env.js";
import {
  ProductModel,
  ProductStatus,
  ProductCondition,
  ProductFavoriteModel,
  ProductReviewModel,
  OrderModel,
  OrderStatus,
  PaymentMethod,
  CartModel,
  UserModel,
} from "../models/index.js";
import {
  sendMarketplaceOrderPaidBuyerEmail,
  sendMarketplaceOrderPaidSellerEmail,
} from "../services/email";
import { WalletService } from "../services/wallet.service";
import { TransactionType } from "../models/transaction.model";
import { createNotification } from "../services/notification";
import { NotificationType } from "../models/common";

const TAP_API_URL = "https://api.tap.company/v2/charges";

function getUserId(req: Request): Types.ObjectId {
  const userId = (req as any).userId;
  return new Types.ObjectId(userId);
}

// ============== PRODUCTS ==============

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const {
      title,
      description,
      price,
      originalPrice,
      currency,
      images,
      category,
      condition,
      location,
      quantity,
      isNegotiable,
      tags,
    } = req.body;

    if (!title || !description || price === undefined || !category) {
      res.status(400).json({ message: "Title, description, price, and category are required" });
      return;
    }

    if (!images || images.length === 0) {
      res.status(400).json({ message: "At least one image is required" });
      return;
    }

    const product = await ProductModel.create({
      title,
      description,
      price,
      originalPrice,
      currency: currency || "SAR",
      images,
      category,
      condition: condition || ProductCondition.new,
      status: ProductStatus.active,
      sellerId: userId,
      location,
      quantity: quantity ?? 1,
      isNegotiable: isNegotiable || false,
      tags,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = "1",
      limit = "20",
      category,
      minPrice,
      maxPrice,
      condition,
      search,
      sellerId,
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { deletedAt: null };

    // Default to active products unless specified
    if (status) {
      filter.status = status;
    } else {
      filter.status = ProductStatus.active;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
    }

    if (condition) {
      filter.condition = condition;
    }

    if (sellerId) {
      filter.sellerId = new Types.ObjectId(sellerId as string);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } },
      ];
    }

    const sortOptions: any = {};
    const validSortFields = ["createdAt", "price", "viewCount", "favoriteCount"];
    if (validSortFields.includes(sortBy as string)) {
      sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Featured products first
    sortOptions.isFeatured = -1;

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate("sellerId", "username firstName lastName avatar verified")
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    // Get average ratings for products
    const productIds = products.map((p) => p._id);
    const ratings = await ProductReviewModel.aggregate([
      { $match: { productId: { $in: productIds }, deletedAt: null } },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const ratingsMap = new Map(ratings.map((r) => [r._id.toString(), r]));

    const productsWithRatings = products.map((product) => {
      const ratingData = ratingsMap.get(product._id.toString());
      const sellerData = product.sellerId as any;
      return {
        ...product,
        rating: ratingData?.avgRating || 0,
        reviewCount: ratingData?.reviewCount || 0,
        seller: sellerData ? {
          _id: sellerData._id,
          username: sellerData.username,
          displayName: sellerData.firstName && sellerData.lastName
            ? `${sellerData.firstName} ${sellerData.lastName}`
            : sellerData.username,
          avatar: sellerData.avatar,
          isVerified: sellerData.verified || false,
        } : null,
        sellerId: sellerData?._id,
      };
    });

    res.json({
      products: productsWithRatings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const userId = getUserId(req);

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await ProductModel.findOne({
      _id: productId,
      deletedAt: null,
    }).populate("sellerId", "username firstName lastName avatar verified bio");

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Increment view count
    await ProductModel.updateOne({ _id: productId }, { $inc: { viewCount: 1 } });

    // Get rating info
    const ratingData = await ProductReviewModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId), deletedAt: null } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    // Check if user has favorited this product
    const isFavorited = await ProductFavoriteModel.exists({
      productId,
      userId,
    });

    const sellerData = product.sellerId as any;
    res.json({
      product: {
        ...product.toObject(),
        rating: ratingData[0]?.avgRating || 0,
        reviewCount: ratingData[0]?.reviewCount || 0,
        seller: sellerData ? {
          _id: sellerData._id,
          username: sellerData.username,
          displayName: sellerData.firstName && sellerData.lastName
            ? `${sellerData.firstName} ${sellerData.lastName}`
            : sellerData.username,
          avatar: sellerData.avatar,
          isVerified: sellerData.verified || false,
          bio: sellerData.bio,
        } : null,
        sellerId: sellerData?._id,
        isFavorited: !!isFavorited,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;
    const updates = req.body;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await ProductModel.findOne({
      _id: productId,
      sellerId: userId,
      deletedAt: null,
    });

    if (!product) {
      res.status(404).json({ message: "Product not found or you don't have permission" });
      return;
    }

    // Fields that can be updated
    const allowedUpdates = [
      "title",
      "description",
      "price",
      "originalPrice",
      "currency",
      "images",
      "category",
      "condition",
      "status",
      "location",
      "quantity",
      "isNegotiable",
      "tags",
    ];

    const filteredUpdates: any = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      filteredUpdates,
      { new: true }
    ).populate("sellerId", "username firstName lastName avatar verified");

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await ProductModel.findOne({
      _id: productId,
      sellerId: userId,
      deletedAt: null,
    });

    if (!product) {
      res.status(404).json({ message: "Product not found or you don't have permission" });
      return;
    }

    await ProductModel.updateOne({ _id: productId }, { deletedAt: new Date() });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getMyProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { page = "1", limit = "20", status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { sellerId: userId, deletedAt: null };
    if (status) {
      filter.status = status;
    }

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============== FAVORITES ==============

export async function toggleFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await ProductModel.findOne({ _id: productId, deletedAt: null });
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const existing = await ProductFavoriteModel.findOne({ productId, userId });

    if (existing) {
      await ProductFavoriteModel.deleteOne({ _id: existing._id });
      await ProductModel.updateOne({ _id: productId }, { $inc: { favoriteCount: -1 } });
      res.json({ message: "Removed from favorites", isFavorited: false });
    } else {
      await ProductFavoriteModel.create({ productId, userId });
      await ProductModel.updateOne({ _id: productId }, { $inc: { favoriteCount: 1 } });
      res.json({ message: "Added to favorites", isFavorited: true });
    }
  } catch (error) {
    next(error);
  }
}

export async function getFavorites(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [favorites, total] = await Promise.all([
      ProductFavoriteModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: "productId",
          match: { deletedAt: null, status: ProductStatus.active },
          populate: { path: "sellerId", select: "username firstName lastName avatar verified" },
        })
        .lean(),
      ProductFavoriteModel.countDocuments({ userId }),
    ]);

    const products = favorites
      .filter((f) => f.productId)
      .map((f) => {
        const product = f.productId as any;
        const sellerData = product?.sellerId;
        return {
          ...product,
          seller: sellerData ? {
            _id: sellerData._id,
            username: sellerData.username,
            displayName: sellerData.firstName && sellerData.lastName
              ? `${sellerData.firstName} ${sellerData.lastName}`
              : sellerData.username,
            avatar: sellerData.avatar,
            isVerified: sellerData.verified || false,
          } : null,
          sellerId: sellerData?._id,
        };
      });

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============== REVIEWS ==============

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;
    const { rating, comment, images } = req.body;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    const product = await ProductModel.findOne({ _id: productId, deletedAt: null });
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Check if user already reviewed
    const existingReview = await ProductReviewModel.findOne({
      productId,
      userId,
      deletedAt: null,
    });

    if (existingReview) {
      res.status(400).json({ message: "You have already reviewed this product" });
      return;
    }

    // Check if user has purchased this product
    const hasPurchased = await OrderModel.exists({
      buyerId: userId,
      "items.productId": new Types.ObjectId(productId),
      status: { $in: [OrderStatus.delivered, OrderStatus.completed] },
    });

    const review = await ProductReviewModel.create({
      productId,
      userId,
      rating,
      comment,
      images,
      isVerifiedPurchase: !!hasPurchased,
    });

    const populatedReview = await ProductReviewModel.findById(review._id).populate(
      "userId",
      "username displayName avatar"
    );

    res.status(201).json({
      message: "Review created successfully",
      review: populatedReview,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const { page = "1", limit = "10" } = req.query;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total, ratingStats] = await Promise.all([
      ProductReviewModel.find({ productId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "username displayName avatar")
        .lean(),
      ProductReviewModel.countDocuments({ productId, deletedAt: null }),
      ProductReviewModel.aggregate([
        { $match: { productId: new Types.ObjectId(productId), deletedAt: null } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
            count2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            count3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          },
        },
      ]),
    ]);

    res.json({
      reviews,
      stats: ratingStats[0] || {
        avgRating: 0,
        count1: 0,
        count2: 0,
        count3: 0,
        count4: 0,
        count5: 0,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============== CART ==============

export async function getCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);

    let cart = await CartModel.findOne({ userId }).populate({
      path: "items.productId",
      match: { deletedAt: null, status: ProductStatus.active },
      populate: { path: "sellerId", select: "username firstName lastName avatar verified" },
    });

    if (!cart) {
      cart = await CartModel.create({ userId, items: [] });
    }

    // Filter out null products (deleted or inactive)
    const validItems = cart.items.filter((item) => item.productId);

    // Group items by seller
    const itemsBySeller = new Map<string, any[]>();
    let subtotal = 0;

    for (const item of validItems) {
      const product = item.productId as any;
      const sellerId = product.sellerId._id.toString();

      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, []);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      const sellerInfo = product.sellerId;
      itemsBySeller.get(sellerId)!.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        quantity: item.quantity,
        seller: sellerInfo ? {
          _id: sellerInfo._id,
          username: sellerInfo.username,
          displayName: sellerInfo.firstName && sellerInfo.lastName
            ? `${sellerInfo.firstName} ${sellerInfo.lastName}`
            : sellerInfo.username,
          avatar: sellerInfo.avatar,
          isVerified: sellerInfo.verified || false,
        } : null,
        itemTotal,
        inStock: product.quantity >= item.quantity,
      });
    }

    res.json({
      cart: {
        items: validItems.map((item) => {
          const prod = item.productId as any;
          const sellerInfo = prod.sellerId;
          return {
            productId: prod._id,
            title: prod.title,
            price: prod.price,
            image: prod.images[0],
            quantity: item.quantity,
            seller: sellerInfo ? {
              _id: sellerInfo._id,
              username: sellerInfo.username,
              displayName: sellerInfo.firstName && sellerInfo.lastName
                ? `${sellerInfo.firstName} ${sellerInfo.lastName}`
                : sellerInfo.username,
              avatar: sellerInfo.avatar,
              isVerified: sellerInfo.verified || false,
            } : null,
            inStock: prod.quantity >= item.quantity,
          };
        }),
        itemsBySeller: Object.fromEntries(itemsBySeller),
        subtotal,
        itemCount: validItems.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addToCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { productId, quantity = 1 } = req.body;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await ProductModel.findOne({
      _id: productId,
      deletedAt: null,
      status: ProductStatus.active,
    });

    if (!product) {
      res.status(404).json({ message: "Product not found or not available" });
      return;
    }

    if (product.sellerId.toString() === userId.toString()) {
      res.status(400).json({ message: "You cannot add your own product to cart" });
      return;
    }

    if (product.quantity < quantity) {
      res.status(400).json({ message: "Not enough stock available" });
      return;
    }

    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      cart = await CartModel.create({
        userId,
        items: [{ productId, quantity, addedAt: new Date() }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, quantity, addedAt: new Date() });
      }

      await cart.save();
    }

    res.json({ message: "Added to cart", itemCount: cart.items.length });
  } catch (error) {
    next(error);
  }
}

export async function updateCartItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    if (quantity < 1) {
      res.status(400).json({ message: "Quantity must be at least 1" });
      return;
    }

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    const item = cart.items.find((item) => item.productId.toString() === productId);

    if (!item) {
      res.status(404).json({ message: "Item not found in cart" });
      return;
    }

    // Check stock
    const product = await ProductModel.findById(productId);
    if (product && product.quantity < quantity) {
      res.status(400).json({ message: "Not enough stock available" });
      return;
    }

    item.quantity = quantity;
    await cart.save();

    res.json({ message: "Cart updated" });
  } catch (error) {
    next(error);
  }
}

export async function removeFromCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      res.status(404).json({ message: "Cart not found" });
      return;
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    res.json({ message: "Item removed from cart", itemCount: cart.items.length });
  } catch (error) {
    next(error);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);

    await CartModel.updateOne({ userId }, { items: [] });

    res.json({ message: "Cart cleared" });
  } catch (error) {
    next(error);
  }
}

// ============== ORDERS ==============

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { productId, quantity = 1, shippingAddress, paymentMethod = PaymentMethod.tap, buyerNotes } = req.body;

    if (paymentMethod === PaymentMethod.cash) {
      res.status(400).json({ message: "Cash on delivery is not available" });
      return;
    }

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await ProductModel.findOne({
      _id: productId,
      deletedAt: null,
      status: ProductStatus.active,
    }).populate("sellerId", "email username firstName lastName");

    if (!product) {
      res.status(404).json({ message: "Product not found or not available" });
      return;
    }

    if (product.sellerId._id.toString() === userId.toString()) {
      res.status(400).json({ message: "You cannot buy your own product" });
      return;
    }

    if (product.quantity < quantity) {
      res.status(400).json({ message: "Not enough stock available" });
      return;
    }

    const subtotal = product.price * quantity;
    const shippingFee = 0; // Free shipping for now
    const serviceFee = 0;
    const total = subtotal + shippingFee;

    const order = await OrderModel.create({
      orderNumber: generateOrderNumber(),
      buyerId: userId,
      sellerId: product.sellerId._id,
      items: [
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          quantity,
          image: product.images[0],
        },
      ],
      subtotal,
      shippingFee,
      serviceFee,
      total,
      currency: product.currency,
      status: OrderStatus.awaitingPayment,
      paymentMethod,
      shippingAddress,
      buyerNotes,
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrderFromCart(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { shippingAddress, paymentMethod = PaymentMethod.tap, buyerNotes } = req.body;

    if (paymentMethod === PaymentMethod.cash) {
      res.status(400).json({ message: "Cash on delivery is not available" });
      return;
    }

    const cart = await CartModel.findOne({ userId }).populate({
      path: "items.productId",
      match: { deletedAt: null, status: ProductStatus.active },
      populate: { path: "sellerId", select: "email username firstName lastName" },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    // Filter valid items and group by seller
    const validItems = cart.items.filter((item) => item.productId);
    const itemsBySeller = new Map<string, any[]>();

    for (const item of validItems) {
      const product = item.productId as any;
      const sellerId = product.sellerId._id.toString();

      if (product.sellerId._id.toString() === userId.toString()) {
        continue; // Skip own products
      }

      if (product.quantity < item.quantity) {
        res.status(400).json({
          message: `Not enough stock for ${product.title}`,
        });
        return;
      }

      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, []);
      }

      itemsBySeller.get(sellerId)!.push({
        product,
        quantity: item.quantity,
      });
    }

    if (itemsBySeller.size === 0) {
      res.status(400).json({ message: "No valid items in cart" });
      return;
    }

    // Create separate orders for each seller
    const orders = [];

    for (const [sellerId, items] of itemsBySeller) {
      const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const shippingFee = 0;
      const serviceFee = 0;
      const total = subtotal + shippingFee;

      const order = await OrderModel.create({
        orderNumber: generateOrderNumber(),
        buyerId: userId,
        sellerId: new Types.ObjectId(sellerId),
        items: items.map((item: any) => ({
          productId: item.product._id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0],
        })),
        subtotal,
        shippingFee,
        serviceFee,
        total,
        currency: items[0].product.currency,
        status: OrderStatus.awaitingPayment,
        paymentMethod,
        shippingAddress,
        buyerNotes,
      });

      orders.push(order);
    }

    // Clear cart after creating orders
    await CartModel.updateOne({ userId }, { items: [] });

    res.status(201).json({
      message: "Orders created successfully",
      orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function initiateOrderPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      status: { $in: [OrderStatus.awaitingPayment, OrderStatus.pending] },
    });

    if (!order) {
      res.status(404).json({ message: "Order not found or already paid" });
      return;
    }

    if (order.paymentMethod !== PaymentMethod.tap) {
      res.status(400).json({ message: "This order does not require online payment" });
      return;
    }

    const user = await UserModel.findById(userId).select("email");
    if (!user?.email) {
      res.status(400).json({ message: "User email not found" });
      return;
    }

    const tapSecretKey = env.TAP_SECRET_KEY;
    if (!tapSecretKey) {
      res.status(501).json({ message: "Payment gateway not configured" });
      return;
    }

    const response = await axios.post(
      TAP_API_URL,
      {
        amount: order.total,
        currency: order.currency,
        threeDSecure: true,
        save_card: false,
        description: `Order #${order.orderNumber}`,
        statement_descriptor: "LamatFikr Market",
        customer: {
          email: user.email,
        },
        metadata: {
          orderId: orderId,
          orderNumber: order.orderNumber,
          userId: userId.toString(),
        },
        source: {
          id: "src_all",
        },
        redirect: {
          url: `${env.FRONTEND_URL}/marketplace/payment/callback?orderId=${orderId}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${tapSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update order with tap charge ID
    await OrderModel.updateOne(
      { _id: orderId },
      {
        tapChargeId: response.data.id,
        status: OrderStatus.awaitingPayment,
        metadata: {
          transactionUrl: response.data.transaction?.url,
        },
      }
    );

    res.json({
      message: "Payment initiated",
      redirectUrl: response.data.transaction?.url,
      chargeId: response.data.id,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Tap Payment Error:", error.response?.data);
      res.status(500).json({ message: "Payment initiation failed", error: error.response?.data });
      return;
    }
    next(error);
  }
}

export async function verifyOrderPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;
    const { tap_id } = req.query;

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    if (!tap_id || typeof tap_id !== "string") {
      res.status(400).json({ message: "Payment ID is required" });
      return;
    }

    const tapSecretKey = env.TAP_SECRET_KEY;
    if (!tapSecretKey) {
      res.status(501).json({ message: "Payment gateway not configured" });
      return;
    }

    // Verify payment with Tap
    const response = await axios.get(`https://api.tap.company/v2/charges/${tap_id}`, {
      headers: {
        Authorization: `Bearer ${tapSecretKey}`,
      },
    });

    const chargeData = response.data;

    if (chargeData.status !== "CAPTURED") {
      await OrderModel.updateOne(
        { _id: orderId },
        { status: OrderStatus.cancelled, cancelReason: "Payment failed" }
      );

      res.status(400).json({
        message: "Payment was not successful",
        status: chargeData.status,
      });
      return;
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      tapChargeId: tap_id,
    });

    if (!order) {
      res.status(400).json({ message: "Order not found" });
      return;
    }

    if (order.status === OrderStatus.paid || order.status === OrderStatus.processing) {
      res.json({
        message: "Payment already verified",
        order,
      });
      return;
    }

    // Update order status
    await OrderModel.updateOne(
      { _id: orderId },
      {
        status: OrderStatus.paid,
        paidAt: new Date(),
      }
    );

    const emailFlags = (order.metadata as any)?.emails || {};
    const shouldSendBuyer = !emailFlags.buyerOrderPaid;
    const shouldSendSeller = !emailFlags.sellerOrderPaid;

    if (shouldSendBuyer || shouldSendSeller) {
      const [buyer, seller] = await Promise.all([
        UserModel.findById(order.buyerId).select("email firstName").lean(),
        UserModel.findById(order.sellerId).select("email firstName").lean(),
      ]);

      const orderUrl = `${env.FRONTEND_URL}/marketplace/orders/${order._id.toString()}`;
      const items = order.items.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        price: i.price,
      }));

      let buyerEmailSent = false;
      let sellerEmailSent = false;

      if (shouldSendBuyer && buyer?.email) {
        await sendMarketplaceOrderPaidBuyerEmail({
          to: buyer.email,
          buyerFirstName: buyer.firstName || "there",
          orderNumber: order.orderNumber,
          total: order.total,
          currency: order.currency,
          orderUrl,
          items,
        });
        buyerEmailSent = true;
      }

      if (shouldSendSeller && seller?.email) {
        await sendMarketplaceOrderPaidSellerEmail({
          to: seller.email,
          sellerFirstName: seller.firstName || "there",
          orderNumber: order.orderNumber,
          total: order.total,
          currency: order.currency,
          orderUrl,
          items,
        });
        sellerEmailSent = true;
      }

      const setUpdates: Record<string, boolean> = {};
      if (buyerEmailSent) setUpdates["metadata.emails.buyerOrderPaid"] = true;
      if (sellerEmailSent) setUpdates["metadata.emails.sellerOrderPaid"] = true;

      if (Object.keys(setUpdates).length > 0) {
        await OrderModel.updateOne(
          { _id: orderId },
          {
            $set: setUpdates,
          }
        );
      }
    }

    // Create in-app notifications
    const orderUrl = `${env.FRONTEND_URL}/marketplace/orders/${order._id.toString()}`;

    // Notify buyer
    await createNotification({
      userId: order.buyerId.toString(),
      type: NotificationType.marketplace_order_paid_buyer,
      targetId: order._id.toString(),
      url: orderUrl,
    });

    // Notify seller
    await createNotification({
      userId: order.sellerId.toString(),
      type: NotificationType.marketplace_order_paid_seller,
      targetId: order._id.toString(),
      url: orderUrl,
    });

    // Credit wallets: 85% to seller, 15% to admin
    try {
      await WalletService.splitPayment(
        order.total,
        order.sellerId as Types.ObjectId,
        TransactionType.productPurchase,
        `Marketplace order #${order.orderNumber}`,
        order._id,
        "Order",
        {
          orderNumber: order.orderNumber,
          buyerId: order.buyerId.toString(),
          itemCount: order.items.length,
        }
      );
    } catch (walletError) {
      console.error("Failed to credit wallets for order payment:", walletError);
      // Continue even if wallet crediting fails
    }

    // Update product quantities
    for (const item of order.items) {
      await ProductModel.updateOne(
        { _id: item.productId },
        { $inc: { quantity: -item.quantity } }
      );

      // Mark as sold if quantity is 0
      await ProductModel.updateOne(
        { _id: item.productId, quantity: { $lte: 0 } },
        { status: ProductStatus.sold }
      );
    }

    const updatedOrder = await OrderModel.findById(orderId);

    res.json({
      message: "Payment verified successfully",
      order: updatedOrder,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Tap Verification Error:", error.response?.data);
      res.status(500).json({ message: "Payment verification failed" });
      return;
    }
    next(error);
  }
}

export async function getMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { page = "1", limit = "20", type = "bought", status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (type === "sold") {
      filter.sellerId = userId;
    } else {
      filter.buyerId = userId;
    }

    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("buyerId", "username firstName lastName avatar")
        .populate("sellerId", "username firstName lastName avatar")
        .lean(),
      OrderModel.countDocuments(filter),
    ]);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate("buyerId", "username firstName lastName avatar email")
      .populate("sellerId", "username firstName lastName avatar email");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;
    const { status, trackingNumber, sellerNotes } = req.body;

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      sellerId: userId,
    });

    if (!order) {
      res.status(404).json({ message: "Order not found or you don't have permission" });
      return;
    }

    const updates: any = {};

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      [OrderStatus.paid]: [OrderStatus.processing, OrderStatus.cancelled],
      [OrderStatus.processing]: [OrderStatus.shipped, OrderStatus.cancelled],
      [OrderStatus.shipped]: [OrderStatus.delivered],
      [OrderStatus.delivered]: [OrderStatus.completed],
    };

    if (status) {
      if (!validTransitions[order.status]?.includes(status)) {
        res.status(400).json({
          message: `Cannot transition from ${order.status} to ${status}`,
        });
        return;
      }

      updates.status = status;

      if (status === OrderStatus.shipped) {
        updates.shippedAt = new Date();
      } else if (status === OrderStatus.delivered) {
        updates.deliveredAt = new Date();
      } else if (status === OrderStatus.completed) {
        updates.completedAt = new Date();
        // Wallet crediting is done at payment verification time, not completion
      }
    }

    if (trackingNumber) {
      updates.trackingNumber = trackingNumber;
    }

    if (sellerNotes) {
      updates.sellerNotes = sellerNotes;
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, updates, { new: true })
      .populate("buyerId", "username firstName lastName avatar")
      .populate("sellerId", "username firstName lastName avatar");

    res.json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      $or: [{ buyerId: userId }, { sellerId: userId }],
    });

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Only allow cancellation for certain statuses
    const cancellableStatuses = [
      OrderStatus.pending,
      OrderStatus.awaitingPayment,
      OrderStatus.paid,
      OrderStatus.processing,
    ];

    if (!cancellableStatuses.includes(order.status as any)) {
      res.status(400).json({ message: "This order cannot be cancelled" });
      return;
    }

    await OrderModel.updateOne(
      { _id: orderId },
      {
        status: OrderStatus.cancelled,
        cancelReason: reason,
        cancelledBy: userId,
        cancelledAt: new Date(),
      }
    );

    // Restore product quantities if order was paid
    if (order.status === OrderStatus.paid || order.status === OrderStatus.processing) {
      for (const item of order.items) {
        await ProductModel.updateOne(
          { _id: item.productId },
          {
            $inc: { quantity: item.quantity },
            status: ProductStatus.active,
          }
        );
      }
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    next(error);
  }
}

// ============== STATS ==============

export async function getMarketplaceStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [totalProducts, totalInStock, featuredCount, categoryStats] = await Promise.all([
      ProductModel.countDocuments({ deletedAt: null, status: ProductStatus.active }),
      ProductModel.countDocuments({
        deletedAt: null,
        status: ProductStatus.active,
        quantity: { $gt: 0 },
      }),
      ProductModel.countDocuments({
        deletedAt: null,
        status: ProductStatus.active,
        isFeatured: true,
      }),
      ProductModel.aggregate([
        { $match: { deletedAt: null, status: ProductStatus.active } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const avgPriceResult = await ProductModel.aggregate([
      { $match: { deletedAt: null, status: ProductStatus.active } },
      { $group: { _id: null, avgPrice: { $avg: "$price" } } },
    ]);

    res.json({
      stats: {
        totalProducts,
        inStock: totalInStock,
        featured: featuredCount,
        avgPrice: avgPriceResult[0]?.avgPrice?.toFixed(2) || "0.00",
        categories: categoryStats,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSellerStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);

    const [productStats, orderStats, revenueStats] = await Promise.all([
      ProductModel.aggregate([
        { $match: { sellerId: userId, deletedAt: null } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      OrderModel.aggregate([
        { $match: { sellerId: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            total: { $sum: "$total" },
          },
        },
      ]),
      OrderModel.aggregate([
        {
          $match: {
            sellerId: userId,
            status: { $in: [OrderStatus.completed, OrderStatus.delivered] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$subtotal" },
            orderCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const productsByStatus = Object.fromEntries(
      productStats.map((s) => [s._id, s.count])
    );

    const ordersByStatus = Object.fromEntries(
      orderStats.map((s) => [s._id, { count: s.count, total: s.total }])
    );

    res.json({
      stats: {
        products: {
          active: productsByStatus[ProductStatus.active] || 0,
          sold: productsByStatus[ProductStatus.sold] || 0,
          inactive: productsByStatus[ProductStatus.inactive] || 0,
          total: Object.values(productsByStatus).reduce((a: number, b: any) => a + b, 0),
        },
        orders: ordersByStatus,
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          completedOrders: revenueStats[0]?.orderCount || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
