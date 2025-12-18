export type Language = "ar" | "en";

export const translations = {
  common: {
    appName: {
      ar: "لمت فكر",
      en: "LamatFikr",
    },
    and: {
      ar: "و",
      en: "and",
    },
  },

  adminNav: {
    dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
    overview: { ar: "نظرة عامة", en: "Overview" },
    users: { ar: "المستخدمون", en: "Users" },
    userDirectory: { ar: "دليل المستخدمين", en: "User Directory" },
    bannedUsers: { ar: "المستخدمون المحظورون", en: "Banned Users" },
    verifiedUsers: { ar: "المستخدمون الموثقون", en: "Verified Users" },
    rolesPermissions: { ar: "الأدوار والصلاحيات", en: "Roles & Permissions" },

    content: { ar: "المحتوى", en: "Content" },
    posts: { ar: "المنشورات", en: "Posts" },
    comments: { ar: "التعليقات", en: "Comments" },
    stories: { ar: "القصص", en: "Stories" },
    uploadsMedia: { ar: "الوسائط والرفع", en: "Uploads & Media" },

    social: { ar: "الاجتماعي", en: "Social" },
    followsFriends: { ar: "المتابعات والأصدقاء", en: "Follows & Friends" },
    blocksMutes: { ar: "الحظر والكتم", en: "Blocks & Mutes" },

    communities: { ar: "المجتمعات", en: "Communities" },
    communitiesList: { ar: "المجتمعات", en: "Communities" },
    groups: { ar: "المجموعات", en: "Groups" },
    pages: { ar: "الصفحات", en: "Pages" },
    rooms: { ar: "الغرف", en: "Rooms" },
    featuredRooms: { ar: "الغرف المميزة", en: "Featured Rooms" },

    messaging: { ar: "الرسائل", en: "Messaging" },
    conversations: { ar: "المحادثات", en: "Conversations" },
    messages: { ar: "الرسائل", en: "Messages" },

    marketplace: { ar: "المتجر", en: "Marketplace" },
    listings: { ar: "العروض", en: "Listings" },
    orders: { ar: "الطلبات", en: "Orders" },

    wallet: { ar: "المحفظة", en: "Wallet" },
    walletOverview: { ar: "نظرة عامة", en: "Overview" },
    transactions: { ar: "المعاملات", en: "Transactions" },
    withdrawals: { ar: "السحوبات", en: "Withdrawals" },
    adminWithdrawals: { ar: "سحوبات (إدارة)", en: "Withdrawals (Admin)" },

    verification: { ar: "التوثيق", en: "Verification" },
    verificationRequests: { ar: "طلبات التوثيق", en: "Requests" },
    verificationStats: { ar: "الإحصائيات", en: "Stats" },

    notifications: { ar: "الإشعارات", en: "Notifications" },
    pushInApp: { ar: "داخل التطبيق", en: "In-app" },

    suggestions: { ar: "الاقتراحات", en: "Suggestions" },
    userSuggestions: { ar: "اقتراحات المستخدمين", en: "User Suggestions" },

    system: { ar: "النظام", en: "System" },
    health: { ar: "الحالة الصحية", en: "Health" },
    stripe: { ar: "Stripe", en: "Stripe" },
  },

  adminUsers: {
    title: { ar: "المستخدمون", en: "Users" },
    bannedTitle: { ar: "المستخدمون المحظورون", en: "Banned Users" },
    verifiedTitle: { ar: "المستخدمون الموثقون", en: "Verified Users" },

    searchPlaceholder: { ar: "ابحث بالاسم أو اسم المستخدم أو البريد", en: "Search by name, username, or email" },
    filters: { ar: "الفلاتر", en: "Filters" },

    colUser: { ar: "المستخدم", en: "User" },
    colUsername: { ar: "اسم المستخدم", en: "Username" },
    colEmail: { ar: "البريد الإلكتروني", en: "Email" },
    colRole: { ar: "الدور", en: "Role" },
    colStatus: { ar: "الحالة", en: "Status" },
    colVerified: { ar: "توثيق", en: "Verified" },
    colEmailVerified: { ar: "تأكيد البريد", en: "Email Verified" },
    colCreatedAt: { ar: "تاريخ الإنشاء", en: "Created" },
    colLastActive: { ar: "آخر نشاط", en: "Last Active" },
    colActions: { ar: "إجراءات", en: "Actions" },

    statusActive: { ar: "نشط", en: "Active" },
    statusBanned: { ar: "محظور", en: "Banned" },

    yes: { ar: "نعم", en: "Yes" },
    no: { ar: "لا", en: "No" },

    actionBan: { ar: "حظر", en: "Ban" },
    actionUnban: { ar: "إلغاء الحظر", en: "Unban" },
    actionGrantVerified: { ar: "منح توثيق لمدة", en: "Grant verified for" },
    actionRevokeVerified: { ar: "إلغاء التوثيق", en: "Revoke verified" },
    actionSetRole: { ar: "تغيير الدور", en: "Set role" },
    actionSetEmailVerified: { ar: "تعديل تأكيد البريد", en: "Set email verified" },
    emailVerifiedTrue: { ar: "مؤكد", en: "Verified" },
    emailVerifiedFalse: { ar: "غير مؤكد", en: "Not verified" },

    batchSelected: { ar: "المحدد", en: "Selected" },
    batchApply: { ar: "تطبيق", en: "Apply" },
    batchNone: { ar: "إجراء جماعي", en: "Batch action" },

    paginationPrev: { ar: "السابق", en: "Prev" },
    paginationNext: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },

    grantDaysLabel: { ar: "عدد الأيام", en: "Days" },
    grantDaysHint: { ar: "مثال: 7 أو 30", en: "Example: 7 or 30" },

    loading: { ar: "جاري التحميل...", en: "Loading..." },
    failedToLoad: { ar: "فشل تحميل المستخدمين", en: "Failed to load users" },
  },

  adminOverview: {
    title: { ar: "نظرة عامة", en: "Overview" },
    totalUsers: { ar: "إجمالي المستخدمين", en: "Total Users" },
    onlineUsers: { ar: "المستخدمون المتصلون", en: "Users Online" },
    bannedUsers: { ar: "المستخدمون المحظورون", en: "Banned Users" },
    visitsToday: { ar: "زيارات اليوم", en: "Visits Today" },
    visitsThisMonth: { ar: "زيارات هذا الشهر", en: "Visits This Month" },
    totalPosts: { ar: "إجمالي المنشورات", en: "Total Posts" },
    postsToday: { ar: "منشورات اليوم", en: "Posts Today" },
    postsThisMonth: { ar: "منشورات هذا الشهر", en: "Posts This Month" },
    totalComments: { ar: "إجمالي التعليقات", en: "Total Comments" },
    commentsToday: { ar: "تعليقات اليوم", en: "Comments Today" },
    commentsThisMonth: { ar: "تعليقات هذا الشهر", en: "Comments This Month" },
    totalCommunities: { ar: "إجمالي المجتمعات", en: "Total Communities" },
    totalRoomChats: { ar: "إجمالي رسائل الغرف", en: "Total Room Chats" },
    totalTransactions: { ar: "إجمالي المعاملات", en: "Total Transactions" },
    transactionsToday: { ar: "معاملات اليوم", en: "Transactions Today" },
    transactionsThisMonth: { ar: "معاملات هذا الشهر", en: "Transactions This Month" },
    completedTransactions: { ar: "المعاملات المكتملة", en: "Completed Transactions" },
    grossTransactionVolume: { ar: "حجم المعاملات (إجمالي)", en: "Transaction Volume (Gross)" },
    netTransactionVolume: { ar: "حجم المعاملات (صافي)", en: "Transaction Volume (Net)" },
    totalWalletBalance: { ar: "إجمالي رصيد المحافظ", en: "Total Wallet Balance" },
    totalPendingBalance: { ar: "الرصيد المعلق", en: "Total Pending Balance" },
    totalEarned: { ar: "إجمالي الأرباح", en: "Total Earned" },
    totalWithdrawn: { ar: "إجمالي المسحوبات", en: "Total Withdrawn" },
    manage: { ar: "إدارة", en: "Manage" },
    viewAll: { ar: "عرض الكل", en: "View all" },
    lastUpdated: { ar: "آخر تحديث", en: "Last updated" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    failedToLoad: { ar: "فشل تحميل الإحصائيات", en: "Failed to load stats" },
  },

  adminCharts: {
    title: { ar: "الرسوم البيانية", en: "Charts" },
    userGrowth: { ar: "نمو المستخدمين", en: "User Growth" },
    transactionsTrend: { ar: "اتجاه المعاملات", en: "Transactions Trend" },
    transactionVolumeTrend: { ar: "اتجاه حجم المعاملات", en: "Transaction Volume Trend" },
    lastNDays: { ar: "آخر 30 يوم", en: "Last 30 days" },
  },

  language: {
    switchLanguage: {
      ar: "English",
      en: "العربية",
    },
  },

  auth: {
    welcomeBack: {
      ar: "مرحباً بعودتك",
      en: "Welcome Back",
    },
    signInContinue: {
      ar: "سجل دخولك لمتابعة لوحة التحكم.",
      en: "Sign in to continue to the admin dashboard.",
    },
    signIn: {
      ar: "تسجيل الدخول",
      en: "Sign In",
    },
    enterCredentials: {
      ar: "أدخل بياناتك للمتابعة",
      en: "Enter your credentials to continue",
    },
    signingIn: {
      ar: "جاري تسجيل الدخول...",
      en: "Signing in...",
    },
    loginSuccess: {
      ar: "تم تسجيل الدخول بنجاح!",
      en: "Login successful!",
    },
    authBackgroundAlt: {
      ar: "خلفية صفحة تسجيل الدخول",
      en: "Login background",
    },
    orContinueWithEmail: {
      ar: "أو تابع بالبريد الإلكتروني",
      en: "or continue with email",
    },
    emailOrUsername: {
      ar: "البريد الإلكتروني",
      en: "Email",
    },
    emailPlaceholder: {
      ar: "admin@example.com",
      en: "admin@example.com",
    },
    password: {
      ar: "كلمة المرور",
      en: "Password",
    },
    passwordPlaceholder: {
      ar: "••••••••",
      en: "••••••••",
    },
    forgotPassword: {
      ar: "نسيت كلمة المرور؟",
      en: "Forgot password?",
    },
    rememberMe: {
      ar: "تذكرني",
      en: "Remember me",
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
    signInWithGoogle: {
      ar: "تسجيل الدخول بجوجل",
      en: "Sign in with Google",
    },
    adminOnly: {
      ar: "هذا القسم مخصص للمشرفين فقط.",
      en: "This area is for administrators only.",
    },
  },
};
