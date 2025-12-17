export type Language = "ar" | "en";

export const translations = {
  // Common
  common: {
    appName: {
      ar: "لمات فكر",
      en: "LamatFikr",
    },
    loading: {
      ar: "جاري التحميل...",
      en: "Loading...",
    },
    save: {
      ar: "حفظ",
      en: "Save",
    },
    cancel: {
      ar: "إلغاء",
      en: "Cancel",
    },
    delete: {
      ar: "حذف",
      en: "Delete",
    },
    edit: {
      ar: "تعديل",
      en: "Edit",
    },
    search: {
      ar: "بحث",
      en: "Search",
    },
    filter: {
      ar: "تصفية",
      en: "Filter",
    },
    all: {
      ar: "الكل",
      en: "All",
    },
    create: {
      ar: "إنشاء",
      en: "Create",
    },
    close: {
      ar: "إغلاق",
      en: "Close",
    },
    back: {
      ar: "رجوع",
      en: "Back",
    },
    next: {
      ar: "التالي",
      en: "Next",
    },
    previous: {
      ar: "السابق",
      en: "Previous",
    },
    yes: {
      ar: "نعم",
      en: "Yes",
    },
    no: {
      ar: "لا",
      en: "No",
    },
    or: {
      ar: "أو",
      en: "or",
    },
    and: {
      ar: "و",
      en: "and",
    },
  },

  // Auth - Login
  auth: {
    welcomeBack: {
      ar: "مرحباً بعودتك",
      en: "Welcome Back",
    },
    signInContinue: {
      ar: "سجل دخولك لمتابعة رحلتك مع لمات فكر. مجتمعك في انتظارك.",
      en: "Sign in to continue your journey with LamatFikr. Your community awaits.",
    },
    signIn: {
      ar: "تسجيل الدخول",
      en: "Sign In",
    },
    signInWithGoogle: {
      ar: "تسجيل الدخول بجوجل",
      en: "Sign in with Google",
    },
    orContinueWithEmail: {
      ar: "أو تابع بالبريد الإلكتروني",
      en: "or continue with email",
    },
    emailOrUsername: {
      ar: "البريد الإلكتروني أو اسم المستخدم",
      en: "Email or Username",
    },
    emailOrUsernamePlaceholder: {
      ar: "john@example.com أو johndoe",
      en: "john@example.com or johndoe",
    },
    password: {
      ar: "كلمة المرور",
      en: "Password",
    },
    forgotPassword: {
      ar: "نسيت كلمة المرور؟",
      en: "Forgot password?",
    },
    rememberMe: {
      ar: "تذكرني لمدة 30 يوم",
      en: "Remember me for 30 days",
    },
    signingIn: {
      ar: "جاري تسجيل الدخول...",
      en: "Signing in...",
    },
    noAccount: {
      ar: "ليس لديك حساب؟",
      en: "Don't have an account?",
    },
    createOne: {
      ar: "أنشئ حساباً",
      en: "Create one",
    },
    enterCredentials: {
      ar: "أدخل بياناتك للمتابعة",
      en: "Enter your credentials to continue",
    },
    termsAgreement: {
      ar: "بتسجيل الدخول، أنت توافق على",
      en: "By signing in, you agree to our",
    },
    termsOfService: {
      ar: "شروط الخدمة",
      en: "Terms of Service",
    },
    privacyPolicy: {
      ar: "سياسة الخصوصية",
      en: "Privacy Policy",
    },

    loginSuccess: {
      ar: "تم تسجيل الدخول بنجاح!",
      en: "Login successful!",
    },

    // Complete Profile
    almostThere: {
      ar: "أوشكت على الانتهاء!",
      en: "Almost There!",
    },
    completeProfileDescription: {
      ar: "باقي القليل لإكمال ملفك الشخصي.",
      en: "Just a few more details to complete your profile.",
    },
    completeYourProfile: {
      ar: "أكمل ملفك الشخصي",
      en: "Complete Your Profile",
    },
    fillRemainingDetails: {
      ar: "يرجى تعبئة البيانات المتبقية",
      en: "Please fill in the remaining details",
    },
    usernameHint: {
      ar: "يُسمح بالأحرف والأرقام والشرطة السفلية فقط",
      en: "Only letters, numbers, and underscores allowed",
    },
    completing: {
      ar: "جاري الإكمال...",
      en: "Completing...",
    },
    profileCompleted: {
      ar: "تم إكمال الملف الشخصي بنجاح!",
      en: "Profile completed successfully!",
    },

    firstNamePlaceholder: {
      ar: "محمد",
      en: "John",
    },
    lastNamePlaceholder: {
      ar: "أحمد",
      en: "Doe",
    },
    usernamePlaceholder: {
      ar: "mohammed_ahmed",
      en: "johndoe",
    },

    emailPlaceholder: {
      ar: "mohammed@example.com",
      en: "john@example.com",
    },

    passwordPlaceholder: {
      ar: "••••••••",
      en: "••••••••",
    },

    authBackgroundAlt: {
      ar: "خلفية صفحة المصادقة",
      en: "Authentication background",
    },

    profileImageAlt: {
      ar: "الصورة الشخصية",
      en: "Profile",
    },

    // Register
    joinLamatfikr: {
      ar: "انضم إلى لمات فكر",
      en: "Join LamatFikr",
    },
    joinDescription: {
      ar: "تواصل مع أشخاص يشاركونك الاهتمامات، شارك أفكارك، وكن جزءاً من مجتمع نابض بالحياة.",
      en: "Connect with like-minded individuals, share your thoughts, and be part of a vibrant community.",
    },
    joinCommunity: {
      ar: "انضم لمجتمعنا اليوم",
      en: "Join our community today",
    },
    createAccount: {
      ar: "إنشاء حساب",
      en: "Create Account",
    },
    signUpWithGoogle: {
      ar: "التسجيل بجوجل",
      en: "Sign up with Google",
    },
    fillDetails: {
      ar: "أدخل بياناتك للبدء",
      en: "Fill in your details to get started",
    },
    firstName: {
      ar: "الاسم الأول",
      en: "First Name",
    },
    lastName: {
      ar: "اسم العائلة",
      en: "Last Name",
    },
    username: {
      ar: "اسم المستخدم",
      en: "Username",
    },
    email: {
      ar: "البريد الإلكتروني",
      en: "Email",
    },
    gender: {
      ar: "الجنس",
      en: "Gender",
    },
    selectGender: {
      ar: "اختر الجنس",
      en: "Select gender",
    },
    male: {
      ar: "ذكر",
      en: "Male",
    },
    female: {
      ar: "أنثى",
      en: "Female",
    },
    other: {
      ar: "آخر",
      en: "Other",
    },
    preferNotToSay: {
      ar: "أفضل عدم الإفصاح",
      en: "Prefer not to say",
    },
    creatingAccount: {
      ar: "جاري إنشاء الحساب...",
      en: "Creating account...",
    },
    alreadyHaveAccount: {
      ar: "لديك حساب بالفعل؟",
      en: "Already have an account?",
    },
    signInLink: {
      ar: "سجل دخولك",
      en: "Sign in",
    },
    createAccountAgreement: {
      ar: "بإنشاء حساب، أنت توافق على",
      en: "By creating an account, you agree to our",
    },
    registrationSuccess: {
      ar: "تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.",
      en: "Registration successful! Please check your email to verify your account.",
    },
  },

  // Navigation
  nav: {
    home: {
      ar: "الرئيسية",
      en: "Home",
    },
    stories: {
      ar: "القصص",
      en: "Stories",
    },
    rooms: {
      ar: "الغرف",
      en: "Rooms",
    },
    marketplace: {
      ar: "السوق",
      en: "Marketplace",
    },
    profile: {
      ar: "الملف الشخصي",
      en: "Profile",
    },
    settings: {
      ar: "الإعدادات",
      en: "Settings",
    },
    logout: {
      ar: "تسجيل الخروج",
      en: "Logout",
    },
    notifications: {
      ar: "الإشعارات",
      en: "Notifications",
    },
    messages: {
      ar: "الرسائل",
      en: "Messages",
    },
  },

  // Home Page
  home: {
    createPost: {
      ar: "إنشاء منشور",
      en: "Create Post",
    },
    whatsOnMind: {
      ar: "ما الذي يدور في ذهنك؟",
      en: "What's on your mind?",
    },
    featuredRooms: {
      ar: "الغرف المميزة",
      en: "Featured Rooms",
    },
    viewAllRooms: {
      ar: "عرض كل الغرف",
      en: "View All Rooms",
    },
    members: {
      ar: "أعضاء",
      en: "members",
    },
    online: {
      ar: "متصل",
      en: "online",
    },
    join: {
      ar: "انضم",
      en: "Join",
    },
    post: {
      ar: "نشر",
      en: "Post",
    },
    like: {
      ar: "إعجاب",
      en: "Like",
    },
    comment: {
      ar: "تعليق",
      en: "Comment",
    },
    share: {
      ar: "مشاركة",
      en: "Share",
    },
  },

  // Stories Page
  stories: {
    title: {
      ar: "القصص",
      en: "Stories",
    },
    backToHome: {
      ar: "العودة للرئيسية",
      en: "Back to Home",
    },
    newStories: {
      ar: "قصص جديدة من الأشخاص الذين تتابعهم",
      en: "new stories from people you follow",
    },
    photos: {
      ar: "صور",
      en: "Photos",
    },
    videos: {
      ar: "فيديوهات",
      en: "Videos",
    },
    noStoriesFound: {
      ar: "لم يتم العثور على قصص",
      en: "No stories found",
    },
    noVideoStories: {
      ar: "لا توجد قصص فيديو لعرضها الآن.",
      en: "There are no video stories to show right now.",
    },
    noPhotoStories: {
      ar: "لا توجد قصص صور لعرضها الآن.",
      en: "There are no photo stories to show right now.",
    },
    viewAllStories: {
      ar: "عرض كل القصص",
      en: "View all stories",
    },
  },

  // Rooms Page
  rooms: {
    title: {
      ar: "غرف المحادثة",
      en: "Room Chats",
    },
    roomsCount: {
      ar: "غرفة",
      en: "rooms",
    },
    unreadMessages: {
      ar: "رسائل غير مقروءة",
      en: "unread messages",
    },
    createRoom: {
      ar: "إنشاء غرفة",
      en: "Create Room",
    },
    searchRooms: {
      ar: "البحث في الغرف...",
      en: "Search rooms...",
    },
    owned: {
      ar: "مملوكة",
      en: "Owned",
    },
    paid: {
      ar: "مدفوعة",
      en: "Paid",
    },
    free: {
      ar: "مجانية",
      en: "Free",
    },
    owner: {
      ar: "مالك",
      en: "owner",
    },
    admin: {
      ar: "مشرف",
      en: "admin",
    },
    member: {
      ar: "عضو",
      en: "member",
    },
    noRoomsFound: {
      ar: "لم يتم العثور على غرف",
      en: "No rooms found",
    },
    tryDifferentSearch: {
      ar: "جرب مصطلح بحث مختلف",
      en: "Try a different search term",
    },
    createFirstRoom: {
      ar: "أنشئ غرفتك الأولى للبدء",
      en: "Create your first room to get started",
    },
    createNewRoom: {
      ar: "إنشاء غرفة جديدة",
      en: "Create New Room Chat",
    },
    roomImage: {
      ar: "صورة الغرفة",
      en: "Room Image",
    },
    uploadImage: {
      ar: "رفع صورة",
      en: "Upload Image",
    },
    recommended: {
      ar: "الموصى به: 300x200 بكسل",
      en: "Recommended: 300x200px",
    },
    roomName: {
      ar: "اسم الغرفة",
      en: "Room Name",
    },
    enterRoomName: {
      ar: "أدخل اسم الغرفة",
      en: "Enter room name",
    },
    description: {
      ar: "الوصف",
      en: "Description",
    },
    describeRoom: {
      ar: "صف موضوع غرفتك",
      en: "Describe what your room is about",
    },
    category: {
      ar: "الفئة",
      en: "Category",
    },
    selectCategory: {
      ar: "اختر فئة",
      en: "Select a category",
    },
    privateRoom: {
      ar: "غرفة خاصة",
      en: "Private Room",
    },
    onlyInvitedMembers: {
      ar: "فقط الأعضاء المدعوون يمكنهم الانضمام",
      en: "Only invited members can join",
    },
    membershipType: {
      ar: "نوع العضوية",
      en: "Membership Type",
    },
    freeDescription: {
      ar: "يمكن لأي شخص الانضمام مجاناً",
      en: "Anyone can join for free",
    },
    paidDescription: {
      ar: "فرض رسوم على العضوية",
      en: "Charge for membership",
    },
    membershipPricing: {
      ar: "تسعير العضوية",
      en: "Membership Pricing",
    },
    price: {
      ar: "السعر",
      en: "Price",
    },
    currency: {
      ar: "العملة",
      en: "Currency",
    },
    pricingNote: {
      ar: "سيتم تحصيل هذا المبلغ من الأعضاء للانضمام إلى غرفتك. ستتلقى المدفوعات مطروحاً منها رسوم المنصة.",
      en: "Members will be charged this amount to join your room. You'll receive payments minus platform fees.",
    },
    premium: {
      ar: "مميز",
      en: "Premium",
    },
    private: {
      ar: "خاص",
      en: "Private",
    },
    members: {
      ar: "الأعضاء",
      en: "Members",
    },
    unread: {
      ar: "غير مقروء",
      en: "Unread",
    },
    premiumRoom: {
      ar: "غرفة مميزة",
      en: "Premium Room",
    },
    membershipFee: {
      ar: "رسوم العضوية:",
      en: "Membership fee:",
    },
    yourRole: {
      ar: "دورك",
      en: "Your Role",
    },
    openChat: {
      ar: "فتح المحادثة",
      en: "Open Chat",
    },
    roomSettings: {
      ar: "إعدادات الغرفة",
      en: "Room Settings",
    },
    leaveRoom: {
      ar: "مغادرة الغرفة",
      en: "Leave Room",
    },
    deleteRoom: {
      ar: "حذف الغرفة",
      en: "Delete Room",
    },
  },

  // Marketplace Page
  marketplace: {
    title: {
      ar: "السوق",
      en: "Marketplace",
    },
    discoverProducts: {
      ar: "اكتشف منتجات رائعة من مجتمعنا",
      en: "Discover amazing products from our community",
    },
    addProduct: {
      ar: "إضافة منتج",
      en: "Add Product",
    },
    totalProducts: {
      ar: "إجمالي المنتجات",
      en: "Total Products",
    },
    inStock: {
      ar: "متوفر",
      en: "In Stock",
    },
    featured: {
      ar: "مميز",
      en: "Featured",
    },
    avgPrice: {
      ar: "متوسط السعر",
      en: "Avg. Price",
    },
    searchProducts: {
      ar: "البحث في المنتجات...",
      en: "Search products...",
    },
    sortBy: {
      ar: "ترتيب حسب",
      en: "Sort by",
    },
    newest: {
      ar: "الأحدث",
      en: "Newest",
    },
    priceLowToHigh: {
      ar: "السعر: من الأقل للأعلى",
      en: "Price: Low to High",
    },
    priceHighToLow: {
      ar: "السعر: من الأعلى للأقل",
      en: "Price: High to Low",
    },
    topRated: {
      ar: "الأعلى تقييماً",
      en: "Top Rated",
    },
    products: {
      ar: "منتجات",
      en: "products",
    },
    noProductsFound: {
      ar: "لم يتم العثور على منتجات",
      en: "No products found",
    },
    adjustSearch: {
      ar: "جرب تعديل البحث أو التصفية للعثور على ما تبحث عنه.",
      en: "Try adjusting your search or filter to find what you're looking for.",
    },
    clearFilters: {
      ar: "مسح الفلاتر",
      en: "Clear Filters",
    },
    electronics: {
      ar: "إلكترونيات",
      en: "Electronics",
    },
    clothing: {
      ar: "ملابس",
      en: "Clothing",
    },
    accessories: {
      ar: "إكسسوارات",
      en: "Accessories",
    },
    homeAndGarden: {
      ar: "المنزل والحديقة",
      en: "Home & Garden",
    },
    sports: {
      ar: "رياضة",
      en: "Sports",
    },
    books: {
      ar: "كتب",
      en: "Books",
    },

    new: {
      ar: "جديد",
      en: "New",
    },
    reviews: {
      ar: "تقييمات",
      en: "reviews",
    },

    viewDetails: {
      ar: "عرض التفاصيل",
      en: "View Details",
    },
    addToCart: {
      ar: "أضف للسلة",
      en: "Add to Cart",
    },

    addNewProduct: {
      ar: "إضافة منتج جديد",
      en: "Add New Product",
    },
    productImages: {
      ar: "صور المنتج",
      en: "Product Images",
    },
    addImage: {
      ar: "إضافة صورة",
      en: "Add Image",
    },
    productTitle: {
      ar: "عنوان المنتج",
      en: "Product Title",
    },
    enterProductTitle: {
      ar: "أدخل عنوان المنتج",
      en: "Enter product title",
    },
    productDescription: {
      ar: "الوصف",
      en: "Description",
    },
    describeYourProduct: {
      ar: "صف منتجك...",
      en: "Describe your product...",
    },
    originalPriceOptional: {
      ar: "السعر الأصلي (اختياري)",
      en: "Original Price (Optional)",
    },
    selectCategoryPlaceholder: {
      ar: "اختر فئة",
      en: "Select a category",
    },
    productIsInStock: {
      ar: "المنتج متوفر في المخزون",
      en: "Product is in stock",
    },
    adding: {
      ar: "جاري الإضافة...",
      en: "Adding...",
    },
    maxImagesAllowed: {
      ar: "الحد الأقصى 4 صور",
      en: "Maximum 4 images allowed",
    },
    productTitleRequired: {
      ar: "عنوان المنتج مطلوب",
      en: "Product title is required",
    },
    descriptionRequired: {
      ar: "الوصف مطلوب",
      en: "Description is required",
    },
    validPriceRequired: {
      ar: "يرجى إدخال سعر صحيح",
      en: "Valid price is required",
    },
    categoryRequired: {
      ar: "الفئة مطلوبة",
      en: "Category is required",
    },
    atLeastOneImageRequired: {
      ar: "يرجى إضافة صورة واحدة على الأقل",
      en: "At least one image is required",
    },

    checkout: {
      ar: "إتمام الشراء",
      en: "Checkout",
    },
    completeYourOrder: {
      ar: "أكمل طلبك ({count} عناصر)",
      en: "Complete your order ({count} items)",
    },
    cartEmpty: {
      ar: "سلة التسوق فارغة",
      en: "Your cart is empty",
    },
    cartEmptyDescription: {
      ar: "أضف بعض المنتجات إلى سلتك قبل إتمام الشراء.",
      en: "Add some products to your cart before checking out.",
    },
    browseProducts: {
      ar: "تصفح المنتجات",
      en: "Browse Products",
    },
    shippingAddress: {
      ar: "عنوان الشحن",
      en: "Shipping Address",
    },
    fullName: {
      ar: "الاسم الكامل",
      en: "Full Name",
    },
    fullNamePlaceholder: {
      ar: "أدخل اسمك الكامل",
      en: "Enter your full name",
    },
    phoneNumber: {
      ar: "رقم الهاتف",
      en: "Phone Number",
    },
    phonePlaceholder: {
      ar: "+966 5xxxxxxxx",
      en: "+1 234 567 8900",
    },
    country: {
      ar: "الدولة",
      en: "Country",
    },
    countryPlaceholder: {
      ar: "الدولة",
      en: "Country",
    },
    addressLine1: {
      ar: "العنوان 1",
      en: "Address Line 1",
    },
    addressLine1Placeholder: {
      ar: "اسم الشارع، صندوق بريد...",
      en: "Street address, P.O. box",
    },
    addressLine2: {
      ar: "العنوان 2",
      en: "Address Line 2",
    },
    addressLine2Placeholder: {
      ar: "شقة، جناح، وحدة، مبنى، طابق...",
      en: "Apartment, suite, unit, building, floor, etc.",
    },
    city: {
      ar: "المدينة",
      en: "City",
    },
    stateOrProvince: {
      ar: "المنطقة / المحافظة",
      en: "State / Province",
    },
    postalCode: {
      ar: "الرمز البريدي",
      en: "Postal Code",
    },
    paymentMethod: {
      ar: "طريقة الدفع",
      en: "Payment Method",
    },
    onlinePayment: {
      ar: "الدفع الإلكتروني",
      en: "Online Payment",
    },
    payWithCardViaTap: {
      ar: "ادفع بالبطاقة عبر Tap",
      en: "Pay with card via Tap",
    },
    cashOnDelivery: {
      ar: "الدفع عند الاستلام",
      en: "Cash on Delivery",
    },
    payWhenYouReceive: {
      ar: "ادفع عند الاستلام",
      en: "Pay when you receive",
    },
    orderNotesOptional: {
      ar: "ملاحظات الطلب (اختياري)",
      en: "Order Notes (Optional)",
    },
    orderNotesPlaceholder: {
      ar: "أضف أي تعليمات خاصة أو ملاحظات للبائع...",
      en: "Add any special instructions or notes for the seller...",
    },
    orderSummary: {
      ar: "ملخص الطلب",
      en: "Order Summary",
    },
    qtyShort: {
      ar: "الكمية",
      en: "Qty",
    },
    subtotal: {
      ar: "المجموع الفرعي",
      en: "Subtotal",
    },
    shipping: {
      ar: "الشحن",
      en: "Shipping",
    },
    free: {
      ar: "مجاني",
      en: "Free",
    },
    serviceFee: {
      ar: "رسوم الخدمة",
      en: "Service Fee",
    },
    total: {
      ar: "الإجمالي",
      en: "Total",
    },
    processing: {
      ar: "جاري المعالجة...",
      en: "Processing...",
    },
    pay: {
      ar: "ادفع",
      en: "Pay",
    },
    placeOrder: {
      ar: "تأكيد الطلب",
      en: "Place Order",
    },
    secureCheckout: {
      ar: "دفع آمن",
      en: "Secure Checkout",
    },
    freeShipping: {
      ar: "شحن مجاني",
      en: "Free Shipping",
    },

    pleaseEnterFullName: {
      ar: "يرجى إدخال الاسم الكامل",
      en: "Please enter your full name",
    },
    pleaseEnterPhone: {
      ar: "يرجى إدخال رقم الهاتف",
      en: "Please enter your phone number",
    },
    pleaseEnterAddress: {
      ar: "يرجى إدخال العنوان",
      en: "Please enter your address",
    },
    pleaseEnterCity: {
      ar: "يرجى إدخال المدينة",
      en: "Please enter your city",
    },
    pleaseEnterCountry: {
      ar: "يرجى إدخال الدولة",
      en: "Please enter your country",
    },
    yourCartIsEmpty: {
      ar: "سلة التسوق فارغة",
      en: "Your cart is empty",
    },
    orderPlacedSuccessfully: {
      ar: "تم إنشاء الطلب بنجاح!",
      en: "Order placed successfully!",
    },
    failedToPlaceOrder: {
      ar: "فشل إنشاء الطلب",
      en: "Failed to place order",
    },

    myOrders: {
      ar: "طلباتي",
      en: "My Orders",
    },
    moreItems: {
      ar: "+{count} عناصر أخرى",
      en: "+{count} more item(s)",
    },
    viewAndManageOrders: {
      ar: "عرض وإدارة طلباتك",
      en: "View and manage your orders",
    },
    continueShopping: {
      ar: "متابعة التسوق",
      en: "Continue Shopping",
    },
    purchases: {
      ar: "المشتريات",
      en: "Purchases",
    },
    sales: {
      ar: "المبيعات",
      en: "Sales",
    },
    searchOrdersPlaceholder: {
      ar: "ابحث برقم الطلب أو المنتج...",
      en: "Search by order number or product...",
    },
    filters: {
      ar: "فلاتر",
      en: "Filters",
    },
    refresh: {
      ar: "تحديث",
      en: "Refresh",
    },
    noOrdersFound: {
      ar: "لم يتم العثور على طلبات",
      en: "No orders found",
    },
    noPurchasesYet: {
      ar: "لم تقم بأي مشتريات بعد.",
      en: "You haven't made any purchases yet.",
    },
    noOrdersReceivedYet: {
      ar: "لم تستلم أي طلبات بعد.",
      en: "You haven't received any orders yet.",
    },
    startShopping: {
      ar: "ابدأ التسوق",
      en: "Start Shopping",
    },
    orderNumber: {
      ar: "رقم الطلب",
      en: "Order #",
    },
    at: {
      ar: "في",
      en: "at",
    },
    card: {
      ar: "بطاقة",
      en: "Card",
    },
    cash: {
      ar: "نقداً",
      en: "Cash",
    },
    seller: {
      ar: "البائع",
      en: "Seller",
    },
    buyer: {
      ar: "المشتري",
      en: "Buyer",
    },
    previous: {
      ar: "السابق",
      en: "Previous",
    },
    next: {
      ar: "التالي",
      en: "Next",
    },
    pageOf: {
      ar: "صفحة {page} من {total}",
      en: "Page {page} of {total}",
    },
    failedToLoadOrders: {
      ar: "فشل تحميل الطلبات",
      en: "Failed to load orders",
    },

    statusAllOrders: {
      ar: "كل الطلبات",
      en: "All Orders",
    },
    statusPending: {
      ar: "قيد الانتظار",
      en: "Pending",
    },
    statusAwaitingPayment: {
      ar: "بانتظار الدفع",
      en: "Awaiting Payment",
    },
    statusPaid: {
      ar: "مدفوع",
      en: "Paid",
    },
    statusProcessing: {
      ar: "قيد المعالجة",
      en: "Processing",
    },
    statusShipped: {
      ar: "تم الشحن",
      en: "Shipped",
    },
    statusDelivered: {
      ar: "تم التسليم",
      en: "Delivered",
    },
    statusCompleted: {
      ar: "مكتمل",
      en: "Completed",
    },
    statusCancelled: {
      ar: "ملغي",
      en: "Cancelled",
    },
    statusRefunded: {
      ar: "مسترجع",
      en: "Refunded",
    },
    statusDisputed: {
      ar: "متنازع عليه",
      en: "Disputed",
    },

    orderDetails: {
      ar: "تفاصيل الطلب",
      en: "Order Details",
    },
    failedToLoadOrderDetails: {
      ar: "فشل تحميل تفاصيل الطلب",
      en: "Failed to load order details",
    },
    orderCancelledSuccessfully: {
      ar: "تم إلغاء الطلب بنجاح",
      en: "Order cancelled successfully",
    },
    failedToCancelOrder: {
      ar: "فشل إلغاء الطلب",
      en: "Failed to cancel order",
    },
    failedToInitiatePayment: {
      ar: "فشل بدء عملية الدفع",
      en: "Failed to initiate payment",
    },
    failedToUpdateOrderStatus: {
      ar: "فشل تحديث حالة الطلب",
      en: "Failed to update order status",
    },
    copiedToClipboard: {
      ar: "تم النسخ إلى الحافظة",
      en: "Copied to clipboard",
    },
    orderNotFound: {
      ar: "الطلب غير موجود",
      en: "Order not found",
    },
    orderNotFoundDescription: {
      ar: "هذا الطلب غير موجود أو ليس لديك صلاحية للوصول إليه.",
      en: "This order doesn't exist or you don't have access to it.",
    },
    backToOrders: {
      ar: "العودة للطلبات",
      en: "Back to Orders",
    },
    placedOn: {
      ar: "تم الطلب في",
      en: "Placed on",
    },
    orderProgress: {
      ar: "تقدم الطلب",
      en: "Order Progress",
    },
    orderItems: {
      ar: "عناصر الطلب",
      en: "Order Items",
    },
    quantity: {
      ar: "الكمية",
      en: "Quantity",
    },
    unitPrice: {
      ar: "سعر الوحدة",
      en: "Unit Price",
    },
    notes: {
      ar: "ملاحظات",
      en: "Notes",
    },
    buyerNotes: {
      ar: "ملاحظات المشتري",
      en: "Buyer Notes",
    },
    sellerNotes: {
      ar: "ملاحظات البائع",
      en: "Seller Notes",
    },
    actions: {
      ar: "إجراءات",
      en: "Actions",
    },
    payNow: {
      ar: "ادفع الآن",
      en: "Pay Now",
    },
    contact: {
      ar: "تواصل",
      en: "Contact",
    },
    cancelOrder: {
      ar: "إلغاء الطلب",
      en: "Cancel Order",
    },
    payment: {
      ar: "الدفع",
      en: "Payment",
    },
    paidOn: {
      ar: "تم الدفع في",
      en: "Paid on",
    },
    tracking: {
      ar: "التتبع",
      en: "Tracking",
    },
    information: {
      ar: "معلومات",
      en: "Information",
    },
    cancelOrderTitle: {
      ar: "إلغاء الطلب",
      en: "Cancel Order",
    },
    cancelOrderConfirm: {
      ar: "هل أنت متأكد أنك تريد إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.",
      en: "Are you sure you want to cancel this order? This action cannot be undone.",
    },
    cancelReasonPlaceholder: {
      ar: "سبب الإلغاء (اختياري)",
      en: "Reason for cancellation (optional)",
    },
    keepOrder: {
      ar: "إبقاء الطلب",
      en: "Keep Order",
    },
    cancelling: {
      ar: "جاري الإلغاء...",
      en: "Cancelling...",
    },
    updating: {
      ar: "جاري التحديث...",
      en: "Updating...",
    },
    confirm: {
      ar: "تأكيد",
      en: "Confirm",
    },
    trackingNumber: {
      ar: "رقم التتبع",
      en: "Tracking Number",
    },
    trackingNumberPlaceholder: {
      ar: "أدخل رقم التتبع",
      en: "Enter tracking number",
    },
    notesForBuyerOptional: {
      ar: "ملاحظات للمشتري (اختياري)",
      en: "Notes for Buyer (Optional)",
    },
    notesForBuyerPlaceholder: {
      ar: "أضف أي ملاحظات للمشتري...",
      en: "Add any notes for the buyer...",
    },

    sellerDashboard: {
      ar: "لوحة تحكم البائع",
      en: "Seller Dashboard",
    },
    salesOverview: {
      ar: "نظرة عامة على المبيعات والأداء",
      en: "Overview of your sales and performance",
    },
    myListings: {
      ar: "إعلاناتي",
      en: "My Listings",
    },
    totalRevenue: {
      ar: "إجمالي الإيرادات",
      en: "Total Revenue",
    },
    completedOrders: {
      ar: "الطلبات المكتملة",
      en: "Completed Orders",
    },
    activeProducts: {
      ar: "المنتجات النشطة",
      en: "Active Products",
    },
    ofTotal: {
      ar: "من أصل {total} إجمالي",
      en: "of {total} total",
    },
    productsSold: {
      ar: "المنتجات المباعة",
      en: "Products Sold",
    },
    orderStatusOverview: {
      ar: "نظرة عامة على حالات الطلبات",
      en: "Order Status Overview",
    },
    awaitingAction: {
      ar: "بانتظار إجراء",
      en: "Awaiting action",
    },
    beingPrepared: {
      ar: "قيد التجهيز",
      en: "Being prepared",
    },
    inTransit: {
      ar: "قيد الشحن",
      en: "In transit",
    },
    successfullyDelivered: {
      ar: "تم التسليم بنجاح",
      en: "Successfully delivered",
    },
    recentOrders: {
      ar: "الطلبات الأخيرة",
      en: "Recent Orders",
    },
    viewAll: {
      ar: "عرض الكل",
      en: "View All",
    },
    noOrdersYet: {
      ar: "لا توجد طلبات بعد",
      en: "No orders yet",
    },
    quickActions: {
      ar: "إجراءات سريعة",
      en: "Quick Actions",
    },
    listNewItemForSale: {
      ar: "أضف منتجاً جديداً للبيع",
      en: "List a new item for sale",
    },
    processOrders: {
      ar: "معالجة الطلبات",
      en: "Process Orders",
    },
    ordersNeedAttention: {
      ar: "طلبات تحتاج متابعة",
      en: "orders need attention",
    },
    manageListings: {
      ar: "إدارة الإعلانات",
      en: "Manage Listings",
    },
    activeProductsCount: {
      ar: "منتجات نشطة",
      en: "active products",
    },
    performanceTips: {
      ar: "نصائح الأداء",
      en: "Performance Tips",
    },
    tipRespond24h: {
      ar: "استجب للطلبات خلال 24 ساعة للحفاظ على تقييم بائع مرتفع",
      en: "Respond to orders within 24 hours to maintain a high seller rating",
    },
    tipAddImages: {
      ar: "أضف عدة صور عالية الجودة لزيادة ظهور المنتج",
      en: "Add multiple high-quality images to increase product visibility",
    },
    tipEngageBuyers: {
      ar: "تفاعل مع المشترين لبناء الثقة وتشجيع عمليات الشراء المتكررة",
      en: "Engage with buyers to build trust and encourage repeat purchases",
    },
    failedToLoadDashboardStats: {
      ar: "فشل تحميل إحصائيات لوحة التحكم",
      en: "Failed to load dashboard stats",
    },
    productCreatedSuccessfully: {
      ar: "تم إنشاء المنتج بنجاح",
      en: "Product created successfully",
    },
    failedToCreateProduct: {
      ar: "فشل إنشاء المنتج",
      en: "Failed to create product",
    },

    addedToFavorites: {
      ar: "تمت الإضافة للمفضلة",
      en: "Added to favorites",
    },
    removedFromFavorites: {
      ar: "تمت الإزالة من المفضلة",
      en: "Removed from favorites",
    },
    failedToUpdateFavorites: {
      ar: "فشل تحديث المفضلة",
      en: "Failed to update favorites",
    },
    
    reviewsLabel: {
      ar: "تقييمات",
      en: "reviews",
    },
    saveAmount: {
      ar: "وفر {amount}",
      en: "Save {amount}",
    },
    inStockWithCount: {
      ar: "متوفر ({count} متاح)",
      en: "In Stock ({count} available)",
    },
    outOfStock: {
      ar: "غير متوفر",
      en: "Out of Stock",
    },
    quantityLabel: {
      ar: "الكمية:",
      en: "Quantity:",
    },
    addingToCart: {
      ar: "جاري الإضافة...",
      en: "Adding...",
    },
    freeShippingShort: {
      ar: "شحن مجاني",
      en: "Free Shipping",
    },
    securePayment: {
      ar: "دفع آمن",
      en: "Secure Payment",
    },
    easyReturns: {
      ar: "إرجاع سهل",
      en: "Easy Returns",
    },
    unknownSeller: {
      ar: "بائع غير معروف",
      en: "Unknown Seller",
    },
    verified: {
      ar: "موثق",
      en: "Verified",
    },
    contactSeller: {
      ar: "تواصل",
      en: "Contact",
    },
    productImageAlt: {
      ar: "صورة المنتج",
      en: "Product image",
    },
    descriptionTab: {
      ar: "الوصف",
      en: "Description",
    },
    reviewsTab: {
      ar: "التقييمات",
      en: "Reviews",
    },
    condition: {
      ar: "الحالة",
      en: "Condition",
    },
    category: {
      ar: "الفئة",
      en: "Category",
    },
    status: {
      ar: "الحالة",
      en: "Status",
    },
    listed: {
      ar: "تاريخ الإدراج",
      en: "Listed",
    },
    notSpecified: {
      ar: "غير محدد",
      en: "Not specified",
    },
    active: {
      ar: "نشط",
      en: "Active",
    },
    unknown: {
      ar: "غير معروف",
      en: "Unknown",
    },

    writeAReview: {
      ar: "اكتب تقييماً",
      en: "Write a Review",
    },
    writeYourReview: {
      ar: "اكتب تقييمك",
      en: "Write Your Review",
    },
    yourRating: {
      ar: "تقييمك",
      en: "Your Rating",
    },
    yourReviewOptional: {
      ar: "مراجعتك (اختياري)",
      en: "Your Review (Optional)",
    },
    reviewPlaceholder: {
      ar: "شارك تجربتك مع هذا المنتج...",
      en: "Share your experience with this product...",
    },
    submitReview: {
      ar: "إرسال التقييم",
      en: "Submit Review",
    },
    submitting: {
      ar: "جاري الإرسال...",
      en: "Submitting...",
    },
    pleaseLoginToReview: {
      ar: "يرجى تسجيل الدخول لإرسال تقييم",
      en: "Please login to submit a review",
    },
    pleaseSelectRating: {
      ar: "يرجى اختيار تقييم",
      en: "Please select a rating",
    },
    reviewSubmitted: {
      ar: "تم إرسال التقييم بنجاح!",
      en: "Review submitted successfully!",
    },
    failedToSubmitReview: {
      ar: "فشل إرسال التقييم",
      en: "Failed to submit review",
    },
    reviewSingular: {
      ar: "تقييم",
      en: "review",
    },
    reviewsPlural: {
      ar: "تقييمات",
      en: "reviews",
    },
    noReviewsYet: {
      ar: "لا توجد تقييمات بعد",
      en: "No reviews yet",
    },
    beFirstToReview: {
      ar: "كن أول من يقيّم هذا المنتج!",
      en: "Be the first to review this product!",
    },
    verifiedPurchase: {
      ar: "شراء موثق",
      en: "Verified Purchase",
    },
    foundHelpful: {
      ar: "وجدوا هذا مفيداً",
      en: "found this helpful",
    },
    poor: {
      ar: "سيئ",
      en: "Poor",
    },
    fair: {
      ar: "مقبول",
      en: "Fair",
    },
    good: {
      ar: "جيد",
      en: "Good",
    },
    veryGood: {
      ar: "جيد جداً",
      en: "Very Good",
    },
    excellent: {
      ar: "ممتاز",
      en: "Excellent",
    },
  },

  // Profile Page
  profile: {
    title: {
      ar: "الملف الشخصي",
      en: "Profile",
    },
    editProfile: {
      ar: "تعديل الملف الشخصي",
      en: "Edit Profile",
    },
    followers: {
      ar: "متابعون",
      en: "Followers",
    },
    following: {
      ar: "يتابع",
      en: "Following",
    },
    posts: {
      ar: "منشورات",
      en: "Posts",
    },
    profileCompletion: {
      ar: "اكتمال الملف الشخصي",
      en: "Profile Completion",
    },
    completeProfile: {
      ar: "أكمل ملفك الشخصي",
      en: "Complete your profile",
    },
  },

  // 404 Page
  notFound: {
    title: {
      ar: "الصفحة غير موجودة",
      en: "Page not found",
    },
    description: {
      ar: "الصفحة التي تبحث عنها غير موجودة، أو ربما تم نقلها.",
      en: "The page you're looking for doesn't exist, or it may have been moved.",
    },
    goToHome: {
      ar: "الذهاب للرئيسية",
      en: "Go to home",
    },
    goBack: {
      ar: "العودة",
      en: "Go back",
    },
  },

  // Categories
  categories: {
    technology: {
      ar: "التكنولوجيا",
      en: "Technology",
    },
    finance: {
      ar: "المالية",
      en: "Finance",
    },
    artAndDesign: {
      ar: "الفن والتصميم",
      en: "Art & Design",
    },
    business: {
      ar: "الأعمال",
      en: "Business",
    },
    healthAndFitness: {
      ar: "الصحة واللياقة",
      en: "Health & Fitness",
    },
    photography: {
      ar: "التصوير",
      en: "Photography",
    },
    music: {
      ar: "الموسيقى",
      en: "Music",
    },
    gaming: {
      ar: "الألعاب",
      en: "Gaming",
    },
    education: {
      ar: "التعليم",
      en: "Education",
    },
    lifestyle: {
      ar: "نمط الحياة",
      en: "Lifestyle",
    },
  },

  // Language
  language: {
    switchLanguage: {
      ar: "English",
      en: "العربية",
    },
    arabic: {
      ar: "العربية",
      en: "Arabic",
    },
    english: {
      ar: "الإنجليزية",
      en: "English",
    },
  },
};

export type TranslationKey = keyof typeof translations;
export type Translations = typeof translations;
