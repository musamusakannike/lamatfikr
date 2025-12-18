import type { RequestHandler } from "express";
import { Types } from "mongoose";

import { OrderModel, OrderStatus, PaymentMethod, ProductModel, ProductStatus } from "../models";

export const listAdminMarketplaceListings: RequestHandler = async (req, res, next) => {
  try {
    const {
      page = "1",
      limit = "20",
      status,
      category,
      sellerId,
      featured,
      deleted = "active",
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (deleted === "deleted") {
      filter.deletedAt = { $ne: null };
    } else if (deleted === "all") {
      // no filter
    } else {
      filter.deletedAt = null;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (sellerId && Types.ObjectId.isValid(sellerId as string)) {
      filter.sellerId = new Types.ObjectId(sellerId as string);
    }

    if (featured === "true") {
      filter.isFeatured = true;
    } else if (featured === "false") {
      filter.isFeatured = false;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } },
      ];
    }

    const sortOptions: Record<string, 1 | -1> = {};
    const validSortFields = ["createdAt", "price", "viewCount", "favoriteCount"];
    if (validSortFields.includes(sortBy as string)) {
      sortOptions[sortBy as string] = (sortOrder as string) === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate("sellerId", "username firstName lastName avatar verified")
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminMarketplaceSetListingFeatured: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { isFeatured } = req.body as { isFeatured?: boolean };

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    if (typeof isFeatured !== "boolean") {
      res.status(400).json({ message: "isFeatured must be boolean" });
      return;
    }

    const updated = await ProductModel.findByIdAndUpdate(productId, { isFeatured }, { new: true })
      .populate("sellerId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
};

export const adminMarketplaceSetListingStatus: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { status } = req.body as { status?: string };

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    if (!status || !(Object.values(ProductStatus) as string[]).includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const updated = await ProductModel.findByIdAndUpdate(productId, { status }, { new: true })
      .populate("sellerId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
};

export const adminMarketplaceDeleteListing: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const updated = await ProductModel.findByIdAndUpdate(productId, { deletedAt: new Date() }, { new: true })
      .populate("sellerId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
};

export const adminMarketplaceRestoreListing: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const updated = await ProductModel.findByIdAndUpdate(productId, { deletedAt: null }, { new: true })
      .populate("sellerId", "username firstName lastName avatar verified")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({ success: true, product: updated });
  } catch (error) {
    next(error);
  }
};

export const listAdminMarketplaceOrders: RequestHandler = async (req, res, next) => {
  try {
    const {
      page = "1",
      limit = "20",
      status,
      paymentMethod,
      buyerId,
      sellerId,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (paymentMethod && paymentMethod !== "all") {
      filter.paymentMethod = paymentMethod;
    }

    if (buyerId && Types.ObjectId.isValid(buyerId as string)) {
      filter.buyerId = new Types.ObjectId(buyerId as string);
    }

    if (sellerId && Types.ObjectId.isValid(sellerId as string)) {
      filter.sellerId = new Types.ObjectId(sellerId as string);
    }

    if (search) {
      filter.$or = [{ orderNumber: { $regex: search, $options: "i" } }];
      if (Types.ObjectId.isValid(search as string)) {
        filter.$or.push({ _id: new Types.ObjectId(search as string) });
      }
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
      success: true,
      orders,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const adminMarketplaceUpdateOrder: RequestHandler = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, sellerNotes } = req.body as {
      status?: string;
      trackingNumber?: string;
      sellerNotes?: string;
    };

    if (!Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const updates: Record<string, any> = {};

    if (status) {
      if (!(Object.values(OrderStatus) as string[]).includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }
      updates.status = status;
    }

    if (trackingNumber !== undefined) updates.trackingNumber = trackingNumber;
    if (sellerNotes !== undefined) updates.sellerNotes = sellerNotes;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: "No updates provided" });
      return;
    }

    if (status === OrderStatus.shipped) updates.shippedAt = new Date();
    if (status === OrderStatus.delivered) updates.deliveredAt = new Date();
    if (status === OrderStatus.completed) updates.completedAt = new Date();
    if (status === OrderStatus.cancelled) updates.cancelledAt = new Date();

    const updated = await OrderModel.findByIdAndUpdate(orderId, updates, { new: true })
      .populate("buyerId", "username firstName lastName avatar")
      .populate("sellerId", "username firstName lastName avatar")
      .lean();

    if (!updated) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json({ success: true, order: updated });
  } catch (error) {
    next(error);
  }
};

export const adminMarketplaceConstants: RequestHandler = async (req, res, next) => {
  try {
    res.json({
      success: true,
      productStatuses: Object.values(ProductStatus),
      orderStatuses: Object.values(OrderStatus),
      paymentMethods: Object.values(PaymentMethod),
    });
  } catch (error) {
    next(error);
  }
};
