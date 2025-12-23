export type Language = "ar" | "en";

export const translations = {
  common: {
    appName: {
      ar: "لمة فكر",
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

    reports: { ar: "البلاغات", en: "Reports" },
    announcements: { ar: "الإعلانات", en: "Announcements" },

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
    companyWallet: { ar: "محفظة الشركة", en: "Company Wallet" },
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
    pricing: { ar: "ادارة الاسعار", en: "Pricing Control" },
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

  adminUserProfile: {
    title: { ar: "ملف المستخدم", en: "User Profile" },
    viewProfile: { ar: "عرض الملف", en: "View Profile" },
    editProfile: { ar: "تعديل الملف", en: "Edit Profile" },
    saveChanges: { ar: "حفظ التغييرات", en: "Save Changes" },
    cancel: { ar: "إلغاء", en: "Cancel" },
    saving: { ar: "جاري الحفظ...", en: "Saving..." },

    // Tabs
    viewMode: { ar: "عرض", en: "View" },
    editMode: { ar: "تعديل", en: "Edit" },

    // Sections
    basicInfo: { ar: "المعلومات الأساسية", en: "Basic Information" },
    personalDetails: { ar: "التفاصيل الشخصية", en: "Personal Details" },
    professional: { ar: "المعلومات المهنية", en: "Professional" },
    interestsLanguages: { ar: "الاهتمامات واللغات", en: "Interests & Languages" },
    accountStatus: { ar: "حالة الحساب", en: "Account Status" },

    // Basic Info Fields
    firstName: { ar: "الاسم الأول", en: "First Name" },
    lastName: { ar: "الاسم الأخير", en: "Last Name" },
    username: { ar: "اسم المستخدم", en: "Username" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    phone: { ar: "الهاتف", en: "Phone" },
    bio: { ar: "النبذة", en: "Bio" },
    birthday: { ar: "تاريخ الميلاد", en: "Birthday" },
    location: { ar: "الموقع", en: "Location" },

    // Personal Details Fields
    gender: { ar: "الجنس", en: "Gender" },
    nationality: { ar: "الجنسية", en: "Nationality" },
    city: { ar: "المدينة", en: "City" },
    relationshipStatus: { ar: "الحالة الاجتماعية", en: "Relationship Status" },

    // Professional Fields
    occupation: { ar: "المهنة", en: "Occupation" },
    workingAt: { ar: "يعمل في", en: "Working At" },
    school: { ar: "المدرسة/الجامعة", en: "School" },
    website: { ar: "الموقع الإلكتروني", en: "Website" },

    // Interests & Languages
    interests: { ar: "الاهتمامات", en: "Interests" },
    languagesSpoken: { ar: "اللغات المنطوقة", en: "Languages Spoken" },
    addInterest: { ar: "إضافة اهتمام", en: "Add Interest" },
    addLanguage: { ar: "إضافة لغة", en: "Add Language" },
    interestsPlaceholder: { ar: "مثال: القراءة، السفر، الرياضة", en: "e.g., Reading, Travel, Sports" },
    languagesPlaceholder: { ar: "مثال: العربية، الإنجليزية", en: "e.g., Arabic, English" },

    // Account Status
    role: { ar: "الدور", en: "Role" },
    banned: { ar: "محظور", en: "Banned" },
    emailVerified: { ar: "البريد مؤكد", en: "Email Verified" },
    verified: { ar: "موثق", en: "Verified" },
    createdAt: { ar: "تاريخ الإنشاء", en: "Created" },
    lastActive: { ar: "آخر نشاط", en: "Last Active" },

    // Gender Options
    male: { ar: "ذكر", en: "Male" },
    female: { ar: "أنثى", en: "Female" },
    other: { ar: "آخر", en: "Other" },
    preferNotToSay: { ar: "أفضل عدم الإفصاح", en: "Prefer not to say" },

    // Relationship Status Options
    single: { ar: "أعزب", en: "Single" },
    inRelationship: { ar: "في علاقة", en: "In a relationship" },
    engaged: { ar: "مخطوب", en: "Engaged" },
    married: { ar: "متزوج", en: "Married" },
    complicated: { ar: "معقدة", en: "It's complicated" },

    // Messages
    loadingProfile: { ar: "جاري تحميل الملف...", en: "Loading profile..." },
    failedToLoad: { ar: "فشل تحميل الملف", en: "Failed to load profile" },
    profileUpdated: { ar: "تم تحديث الملف بنجاح", en: "Profile updated successfully" },
    failedToUpdate: { ar: "فشل تحديث الملف", en: "Failed to update profile" },
  },

  adminVerification: {
    title: { ar: "طلبات التوثيق", en: "Verification Requests" },
    statusAll: { ar: "الكل", en: "All" },
    statusPending: { ar: "قيد الانتظار", en: "Pending" },
    statusApproved: { ar: "مقبول", en: "Approved" },
    statusRejected: { ar: "مرفوض", en: "Rejected" },

    colUser: { ar: "المستخدم", en: "User" },
    colDocumentType: { ar: "نوع المستند", en: "Document type" },
    colStatus: { ar: "الحالة", en: "Status" },
    colCreatedAt: { ar: "تاريخ الإرسال", en: "Submitted" },
    colReviewedAt: { ar: "تاريخ المراجعة", en: "Reviewed" },
    colActions: { ar: "إجراءات", en: "Actions" },

    btnOpenFront: { ar: "فتح الوجه الأمامي", en: "Open front" },
    btnOpenBack: { ar: "فتح الوجه الخلفي", en: "Open back" },
    btnOpenSelfie: { ar: "فتح السيلفي", en: "Open selfie" },
    btnApprove: { ar: "موافقة", en: "Approve" },
    btnReject: { ar: "رفض", en: "Reject" },
    notesPromptApprove: { ar: "ملاحظات المشرف (اختياري)", en: "Admin notes (optional)" },
    notesPromptReject: { ar: "سبب الرفض (اختياري)", en: "Rejection reason (optional)" },

    loading: { ar: "جاري التحميل...", en: "Loading..." },
    empty: { ar: "لا توجد طلبات", en: "No requests" },
    failedToLoad: { ar: "فشل تحميل طلبات التوثيق", en: "Failed to load verification requests" },

    paginationPrev: { ar: "السابق", en: "Prev" },
    paginationNext: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },
  },

  adminRoles: {
    title: { ar: "الأدوار والصلاحيات", en: "Roles & Permissions" },
    subtitle: { ar: "ملخص سريع للأدوار والصلاحيات (للعرض فقط)", en: "Quick summary of roles and permissions (view-only)" },
    lastUpdated: { ar: "آخر تحديث", en: "Last updated" },

    rolesSummary: { ar: "ملخص الأدوار", en: "Roles summary" },
    role: { ar: "الدور", en: "Role" },
    usersCount: { ar: "عدد المستخدمين", en: "Users" },

    permissionsMatrix: { ar: "مصفوفة الصلاحيات", en: "Permissions matrix" },
    note: {
      ar: "ملاحظة: الصلاحيات تُفرض على مستوى الخادم. هذا الجدول للعرض فقط.",
      en: "Note: permissions are enforced server-side. This table is view-only.",
    },

    roleUser: { ar: "مستخدم", en: "User" },
    roleModerator: { ar: "مشرف", en: "Moderator" },
    roleAdmin: { ar: "مدير", en: "Admin" },
    roleSuperadmin: { ar: "مدير أعلى", en: "Superadmin" },

    permViewUsers: { ar: "عرض المستخدمين", en: "View users" },
    permManageUsers: { ar: "إدارة المستخدمين", en: "Manage users" },
    permBanUnban: { ar: "حظر/إلغاء الحظر", en: "Ban/Unban" },
    permGrantVerified: { ar: "منح شارة التوثيق", en: "Grant verified badge" },
    permManageContent: { ar: "إدارة المحتوى", en: "Manage content" },
    permManagePosts: { ar: "إدارة المنشورات", en: "Manage posts" },
    permManageComments: { ar: "إدارة التعليقات", en: "Manage comments" },
    permManageStories: { ar: "إدارة القصص", en: "Manage stories" },
    permManageMedia: { ar: "إدارة الوسائط", en: "Manage uploads & media" },
    permManageWallet: { ar: "إدارة المحفظة", en: "Manage wallet" },
    permManageVerification: { ar: "إدارة التوثيق", en: "Manage verification" },
    permViewAnalytics: { ar: "عرض التحليلات", en: "View analytics" },
  },

  adminContent: {
    postsTitle: { ar: "المنشورات", en: "Posts" },
    commentsTitle: { ar: "التعليقات", en: "Comments" },
    storiesTitle: { ar: "القصص", en: "Stories" },
    mediaTitle: { ar: "الوسائط والرفع", en: "Uploads & Media" },

    searchPlaceholderPosts: { ar: "ابحث في نص المنشور أو الموقع أو الشعور", en: "Search post text, location, or feeling" },
    searchPlaceholderComments: { ar: "ابحث في نص التعليق", en: "Search comment text" },
    searchPlaceholderMedia: { ar: "ابحث في رابط الملف", en: "Search by file URL" },

    status: { ar: "الحالة", en: "Status" },
    statusActive: { ar: "نشط", en: "Active" },
    statusDeleted: { ar: "محذوف", en: "Deleted" },
    statusAll: { ar: "الكل", en: "All" },

    type: { ar: "النوع", en: "Type" },
    typeAll: { ar: "الكل", en: "All" },

    colId: { ar: "المعرف", en: "ID" },
    colUser: { ar: "المستخدم", en: "User" },
    colText: { ar: "النص", en: "Text" },
    colPostId: { ar: "معرف المنشور", en: "Post ID" },
    colMediaCount: { ar: "عدد الوسائط", en: "Media" },
    colCreatedAt: { ar: "تاريخ الإنشاء", en: "Created" },
    colExpiresAt: { ar: "ينتهي في", en: "Expires" },
    colActions: { ar: "إجراءات", en: "Actions" },

    btnDelete: { ar: "حذف", en: "Delete" },
    btnRestore: { ar: "استعادة", en: "Restore" },

    loading: { ar: "جاري التحميل...", en: "Loading..." },
    failedToLoad: { ar: "فشل التحميل", en: "Failed to load" },
    confirmDelete: { ar: "هل أنت متأكد من الحذف؟", en: "Are you sure you want to delete?" },
    confirmRestore: { ar: "هل أنت متأكد من الاستعادة؟", en: "Are you sure you want to restore?" },

    paginationPrev: { ar: "السابق", en: "Prev" },
    paginationNext: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },
  },

  adminWallet: {
    overviewTitle: { ar: "نظرة عامة على المحفظة", en: "Wallet Overview" },
    overviewSubtitle: { ar: "ملخص سريع ومؤشرات مهمة", en: "Quick summary and key metrics" },
    balance: { ar: "الرصيد", en: "Balance" },
    pendingBalance: { ar: "رصيد معلّق", en: "Pending balance" },
    totalEarned: { ar: "إجمالي الأرباح", en: "Total earned" },
    totalWithdrawn: { ar: "إجمالي المسحوب", en: "Total withdrawn" },
    currency: { ar: "العملة", en: "Currency" },
    lastTransactionAt: { ar: "آخر معاملة", en: "Last transaction" },
    recentTransactions: { ar: "آخر المعاملات", en: "Recent transactions" },

    transactionsTitle: { ar: "المعاملات", en: "Transactions" },
    withdrawalsTitle: { ar: "السحوبات", en: "Withdrawals" },
    adminWithdrawalsTitle: { ar: "سحوبات (إدارة)", en: "Withdrawals (Admin)" },

    filterType: { ar: "نوع المعاملة", en: "Type" },
    filterStatus: { ar: "الحالة", en: "Status" },
    filterAll: { ar: "الكل", en: "All" },

    statusPending: { ar: "قيد الانتظار", en: "Pending" },
    statusProcessing: { ar: "قيد المعالجة", en: "Processing" },
    statusCompleted: { ar: "مكتملة", en: "Completed" },
    statusRejected: { ar: "مرفوضة", en: "Rejected" },
    statusCancelled: { ar: "ملغاة", en: "Cancelled" },
    statusFailed: { ar: "فشلت", en: "Failed" },

    typeRoomPayment: { ar: "دفع غرفة", en: "Room payment" },
    typeProductPurchase: { ar: "شراء منتج", en: "Product purchase" },
    typeWithdrawal: { ar: "سحب", en: "Withdrawal" },
    typeRefund: { ar: "استرجاع", en: "Refund" },
    typePlatformFee: { ar: "رسوم المنصة", en: "Platform fee" },

    colId: { ar: "المعرف", en: "ID" },
    colUser: { ar: "المستخدم", en: "User" },
    colAmount: { ar: "المبلغ", en: "Amount" },
    colDescription: { ar: "الوصف", en: "Description" },
    colType: { ar: "النوع", en: "Type" },
    colStatus: { ar: "الحالة", en: "Status" },
    colMethod: { ar: "الطريقة", en: "Method" },
    colCreatedAt: { ar: "تاريخ الإنشاء", en: "Created" },
    colProcessedAt: { ar: "تاريخ المعالجة", en: "Processed" },
    colProcessedBy: { ar: "تمت المعالجة بواسطة", en: "Processed by" },
    colActions: { ar: "إجراءات", en: "Actions" },

    methodBankTransfer: { ar: "تحويل بنكي", en: "Bank transfer" },
    methodPaypal: { ar: "بايبال", en: "PayPal" },
    methodTap: { ar: "تاب", en: "Tap" },

    btnMarkProcessing: { ar: "وضع قيد المعالجة", en: "Mark processing" },
    btnApprove: { ar: "اعتماد", en: "Approve" },
    btnReject: { ar: "رفض", en: "Reject" },
    rejectReasonPrompt: { ar: "اكتب سبب الرفض", en: "Enter rejection reason" },

    loading: { ar: "جاري التحميل...", en: "Loading..." },
    failedToLoad: { ar: "فشل التحميل", en: "Failed to load" },
    paginationPrev: { ar: "السابق", en: "Prev" },
    paginationNext: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },
  },

  companyWallet: {
    title: { ar: "محفظة الشركة", en: "Company Wallet" },
    subtitle: { ar: "أرباح المنصة وسجل المعاملات", en: "Platform revenue and transaction history" },
    balance: { ar: "الرصيد", en: "Balance" },
    pendingBalance: { ar: "رصيد معلّق", en: "Pending balance" },
    totalEarned: { ar: "إجمالي الأرباح", en: "Total earned" },
    totalWithdrawn: { ar: "إجمالي المسحوب", en: "Total withdrawn" },
    lastTransactionAt: { ar: "آخر معاملة", en: "Last transaction" },
    platformTransactions: { ar: "معاملات رسوم المنصة", en: "Platform Fee Transactions" },

    typeRoomPayment: { ar: "دفع غرفة", en: "Room payment" },
    typeProductPurchase: { ar: "شراء منتج", en: "Product purchase" },
    typePlatformFee: { ar: "رسوم المنصة", en: "Platform fee" },
    typeWithdrawal: { ar: "سحب", en: "Withdrawal" },
    typeRefund: { ar: "استرجاع", en: "Refund" },

    colId: { ar: "المعرف", en: "ID" },
    colType: { ar: "النوع", en: "Type" },
    colAmount: { ar: "المبلغ", en: "Amount" },
    colDescription: { ar: "الوصف", en: "Description" },
    colStatus: { ar: "الحالة", en: "Status" },
    colCreatedAt: { ar: "تاريخ الإنشاء", en: "Created" },

    loading: { ar: "جاري التحميل...", en: "Loading..." },
    loadingTransactions: { ar: "جاري تحميل المعاملات...", en: "Loading transactions..." },
    failedToLoad: { ar: "فشل التحميل", en: "Failed to load" },
    noTransactions: { ar: "لا توجد معاملات", en: "No transactions" },

    showingPage: { ar: "عرض الصفحة", en: "Showing page" },
    of: { ar: "من", en: "of" },
    previous: { ar: "السابق", en: "Previous" },
    next: { ar: "التالي", en: "Next" },
  },

  adminSocial: {
    topFollowedTitle: { ar: "الأكثر متابعة", en: "Top Followed" },
    topFollowedSubtitle: { ar: "ترتيب المستخدمين حسب عدد المتابعين", en: "Ranking users by follower count" },
    colRank: { ar: "الترتيب", en: "Rank" },
    colUser: { ar: "المستخدم", en: "User" },
    colFollowers: { ar: "المتابعون", en: "Followers" },
    colUserId: { ar: "معرف المستخدم", en: "User ID" },
    loading: { ar: "جاري التحميل...", en: "Loading..." },
    failedToLoad: { ar: "فشل التحميل", en: "Failed to load" },
    paginationPrev: { ar: "السابق", en: "Prev" },
    paginationNext: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },
  },

  adminMarketplace: {
    listingsTitle: { ar: "عروض المتجر", en: "Marketplace Listings" },
    ordersTitle: { ar: "طلبات المتجر", en: "Marketplace Orders" },

    searchPlaceholderListings: { ar: "ابحث بالعنوان أو الوصف", en: "Search by title or description" },
    searchPlaceholderOrders: { ar: "ابحث برقم الطلب أو المعرف", en: "Search by order number or ID" },

    filterStatus: { ar: "الحالة", en: "Status" },
    filterCategory: { ar: "التصنيف", en: "Category" },
    filterFeatured: { ar: "مميز", en: "Featured" },
    filterDeleted: { ar: "المحذوف", en: "Deleted" },
    filterPaymentMethod: { ar: "طريقة الدفع", en: "Payment" },
    filterAll: { ar: "الكل", en: "All" },

    deletedActive: { ar: "نشط", en: "Active" },
    deletedDeleted: { ar: "محذوف", en: "Deleted" },
    deletedAll: { ar: "الكل", en: "All" },

    featuredOnly: { ar: "المميز فقط", en: "Featured only" },
    featuredYes: { ar: "نعم", en: "Yes" },
    featuredNo: { ar: "لا", en: "No" },

    statusActive: { ar: "نشط", en: "Active" },
    statusInactive: { ar: "غير نشط", en: "Inactive" },
    statusSold: { ar: "مباع", en: "Sold" },
    statusReserved: { ar: "محجوز", en: "Reserved" },

    orderStatusPending: { ar: "قيد الانتظار", en: "Pending" },
    orderStatusAwaitingPayment: { ar: "بانتظار الدفع", en: "Awaiting payment" },
    orderStatusPaid: { ar: "مدفوع", en: "Paid" },
    orderStatusProcessing: { ar: "قيد المعالجة", en: "Processing" },
    orderStatusShipped: { ar: "تم الشحن", en: "Shipped" },
    orderStatusDelivered: { ar: "تم التسليم", en: "Delivered" },
    orderStatusCompleted: { ar: "مكتمل", en: "Completed" },
    orderStatusCancelled: { ar: "ملغى", en: "Cancelled" },
    orderStatusRefunded: { ar: "مسترد", en: "Refunded" },
    orderStatusDisputed: { ar: "متنازع عليه", en: "Disputed" },

    paymentTap: { ar: "تاب", en: "Tap" },
    paymentCash: { ar: "نقداً", en: "Cash" },

    colId: { ar: "المعرف", en: "ID" },
    colTitle: { ar: "العنوان", en: "Title" },
    colPrice: { ar: "السعر", en: "Price" },
    colSeller: { ar: "البائع", en: "Seller" },
    colCategory: { ar: "التصنيف", en: "Category" },
    colStatus: { ar: "الحالة", en: "Status" },
    colFeatured: { ar: "مميز", en: "Featured" },
    colDeleted: { ar: "محذوف", en: "Deleted" },
    colCreatedAt: { ar: "تاريخ الإنشاء", en: "Created" },
    colActions: { ar: "إجراءات", en: "Actions" },

    colOrderNumber: { ar: "رقم الطلب", en: "Order #" },
    colBuyer: { ar: "المشتري", en: "Buyer" },
    colTotal: { ar: "الإجمالي", en: "Total" },
    colPayment: { ar: "الدفع", en: "Payment" },
    colItems: { ar: "العناصر", en: "Items" },

    btnFeature: { ar: "تمييز", en: "Feature" },
    btnUnfeature: { ar: "إلغاء التمييز", en: "Unfeature" },
    btnActivate: { ar: "تفعيل", en: "Activate" },
    btnDeactivate: { ar: "تعطيل", en: "Deactivate" },
    btnDelete: { ar: "حذف", en: "Delete" },
    btnRestore: { ar: "استعادة", en: "Restore" },
    btnUpdateStatus: { ar: "تحديث الحالة", en: "Update status" },
    btnSetTracking: { ar: "تعيين رقم التتبع", en: "Set tracking" },

    trackingPrompt: { ar: "أدخل رقم التتبع", en: "Enter tracking number" },

    loading: { ar: "جاري التحميل...", en: "Loading..." },
    failedToLoad: { ar: "فشل التحميل", en: "Failed to load" },
    confirmDelete: { ar: "هل أنت متأكد من الحذف؟", en: "Are you sure you want to delete?" },
    confirmRestore: { ar: "هل أنت متأكد من الاستعادة؟", en: "Are you sure you want to restore?" },

    paginationPrev: { ar: "السابق", en: "Prev" },
    paginationNext: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },
  },

  adminCommunityRoom: {
    communitiesTitle: { ar: "المجتمعات", en: "Communities" },
    roomsTitle: { ar: "غرف الدردشة", en: "Room Chats" },
    featuredRoomsTitle: { ar: "الغرف المميزة", en: "Featured Rooms" },

    membersTitle: { ar: "الأعضاء", en: "Members" },
    messagesTitle: { ar: "الرسائل", en: "Messages" },

    searchPlaceholder: { ar: "بحث بالاسم أو الوصف", en: "Search by name or description" },
    searchPlaceholderMessages: { ar: "بحث في نص الرسالة", en: "Search message text" },

    filterAll: { ar: "الكل", en: "All" },
    filterDeleted: { ar: "المحذوف", en: "Deleted" },
    deletedActive: { ar: "نشط", en: "Active" },
    deletedDeleted: { ar: "محذوف", en: "Deleted" },
    deletedAll: { ar: "الكل", en: "All" },

    filterRole: { ar: "الدور", en: "Role" },
    roleOwner: { ar: "مالك", en: "Owner" },
    roleAdmin: { ar: "مشرف", en: "Admin" },
    roleMember: { ar: "عضو", en: "Member" },

    filterStatus: { ar: "الحالة", en: "Status" },
    statusPending: { ar: "قيد الانتظار", en: "Pending" },
    statusApproved: { ar: "مقبول", en: "Approved" },
    statusRejected: { ar: "مرفوض", en: "Rejected" },
    statusAwaitingPayment: { ar: "بانتظار الدفع", en: "Awaiting payment" },

    membershipFree: { ar: "مجاني", en: "Free" },
    membershipPaid: { ar: "مدفوع", en: "Paid" },

    colId: { ar: "المعرف", en: "ID" },
    colName: { ar: "الاسم", en: "Name" },
    colCategory: { ar: "التصنيف", en: "Category" },
    colOwner: { ar: "المالك", en: "Owner" },
    colMembers: { ar: "الأعضاء", en: "Members" },
    colRoomType: { ar: "النوع", en: "Type" },
    colPrivate: { ar: "خاص", en: "Private" },
    colStatus: { ar: "الحالة", en: "Status" },
    colCoverImage: { ar: "صورة الغلاف", en: "Cover Image" },
    colDeleted: { ar: "محذوف", en: "Deleted" },
    colCreatedAt: { ar: "تاريخ الإنشاء", en: "Created" },
    colActions: { ar: "إجراءات", en: "Actions" },

    colUser: { ar: "المستخدم", en: "User" },
    colRole: { ar: "الدور", en: "Role" },
    colJoinedAt: { ar: "تاريخ الانضمام", en: "Joined" },
    colMessage: { ar: "الرسالة", en: "Message" },
    colSender: { ar: "المرسل", en: "Sender" },

    colAmount: { ar: "المبلغ", en: "Amount" },
    colStart: { ar: "البداية", en: "Start" },
    colEnd: { ar: "النهاية", en: "End" },

    yes: { ar: "نعم", en: "Yes" },
    no: { ar: "لا", en: "No" },

    btnDelete: { ar: "حذف", en: "Delete" },
    btnRestore: { ar: "استعادة", en: "Restore" },
    btnViewMembers: { ar: "الأعضاء", en: "Members" },
    btnViewMessages: { ar: "الرسائل", en: "Messages" },
    btnSetRole: { ar: "تغيير الدور", en: "Set role" },
    btnSetStatus: { ar: "تغيير الحالة", en: "Set status" },
    btnRemoveMember: { ar: "إزالة", en: "Remove" },

    btnCancel: { ar: "إلغاء", en: "Cancel" },
    btnExpire: { ar: "إنهاء", en: "Expire" },

    confirmDelete: { ar: "هل أنت متأكد من الحذف؟", en: "Are you sure you want to delete?" },
    confirmRestore: { ar: "هل أنت متأكد من الاستعادة؟", en: "Are you sure you want to restore?" },
    confirmRemove: { ar: "هل أنت متأكد من إزالة العضو؟", en: "Are you sure you want to remove this member?" },

    loading: { ar: "جاري التحميل...", en: "Loading..." },
    failedToLoad: { ar: "فشل التحميل", en: "Failed to load" },
    paginationPrev: { ar: "السابق", en: "Prev" },
    paginationNext: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },
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

  adminReports: {
    title: { ar: "البلاغات", en: "Reports" },
    reporter: { ar: "المُبلِغ", en: "Reporter" },
    target: { ar: "الهدف", en: "Target" },
    reason: { ar: "السبب", en: "Reason" },
    status: { ar: "الحالة", en: "Status" },
    created: { ar: "تاريخ الإنشاء", en: "Created" },
    reportDetailsTitle: { ar: "تفاصيل البلاغ", en: "Report Details" },
    replyViaEmail: { ar: "الرد عبر البريد الإلكتروني", en: "Reply via Email" },
    replyPlaceholder: { ar: "اكتب ردك هنا...", en: "Write your reply here..." },
    sendReply: { ar: "إرسال الرد", en: "Send Reply" },
    sending: { ar: "جاري الإرسال...", en: "Sending..." },
    replySentSuccess: { ar: "تم إرسال الرد بنجاح", en: "Reply sent successfully" },
    replySentError: { ar: "فشل إرسال الرد", en: "Failed to send reply" },
  },

  adminAnnouncements: {
    title: { ar: "الإعلانات", en: "Announcements" },
    subtitle: { ar: "إدارة إعلانات المنصة للمستخدمين", en: "Manage platform announcements for users" },
    createNew: { ar: "إعلان جديد", en: "New Announcement" },
    createModalTitle: { ar: "إنشاء إعلان جديد", en: "Create New Announcement" },
    editModalTitle: { ar: "تعديل الإعلان", en: "Edit Announcement" },

    searchPlaceholder: { ar: "بحث في الإعلانات", en: "Search announcements" },

    colTitle: { ar: "العنوان", en: "Title" },
    colType: { ar: "النوع", en: "Type" },
    colTarget: { ar: "الجمهور", en: "Target" },
    colStatus: { ar: "الحالة", en: "Status" },
    colDate: { ar: "تاريخ الإنشاء", en: "Created" },
    colActions: { ar: "إجراءات", en: "Actions" },
    colPriority: { ar: "الأولوية", en: "Priority" },
    colContent: { ar: "المحتوى", en: "Content" },

    formTitle: { ar: "العنوان", en: "Title" },
    formMessage: { ar: "المحتوى", en: "Content" },
    formType: { ar: "النوع", en: "Type" },
    formTarget: { ar: "الجمهور المستهدف", en: "Target Audience" },
    formPriority: { ar: "الأولوية", en: "Priority" },
    formStatus: { ar: "الحالة", en: "Status" },

    priorityLow: { ar: "منخفضة", en: "Low" },
    priorityMedium: { ar: "متوسطة", en: "Medium" },
    priorityHigh: { ar: "عالية", en: "High" },

    statusActive: { ar: "نشط", en: "Active" },
    statusInactive: { ar: "غير نشط", en: "Inactive" },
    statusDeleted: { ar: "محذوف", en: "Deleted" },

    btnEdit: { ar: "تعديل", en: "Edit" },
    btnDelete: { ar: "حذف", en: "Delete" },
    btnCancel: { ar: "إلغاء", en: "Cancel" },
    btnSave: { ar: "حفظ", en: "Save" },
    btnCreate: { ar: "إنشاء", en: "Create" },
    btnUpdate: { ar: "تحديث", en: "Update" },
    btnSaving: { ar: "جاري الحفظ...", en: "Saving..." },

    createSuccess: { ar: "تم إنشاء الإعلان بنجاح", en: "Announcement created successfully" },
    deleteSuccess: { ar: "تم حذف الإعلان", en: "Announcement deleted" },
    confirmDelete: { ar: "هل أنت متأكد من الحذف؟", en: "Are you sure you want to delete?" },

    paginationPrev: { ar: "السابق", en: "Previous" },
    paginationNext: { ar: "التالي", en: "Next" },
    page: { ar: "صفحة", en: "Page" },
    of: { ar: "من", en: "of" },

    loading: { ar: "جاري التحميل...", en: "Loading..." },
    failedToLoad: { ar: "فشل تحميل الإعلانات", en: "Failed to load announcements" },
    noData: { ar: "لا توجد إعلانات", en: "No announcements found" },
  },

  language: {
    switchLanguage: {
      ar: "English",
      en: "العربية",
    },
  },

  adminPricing: {
    title: { ar: "ادارة الاسعار", en: "Pricing Control" },
    subtitle: { ar: "تحكم بأسعار الميزات والخدمات", en: "Manage prices for features and services" },
    saveSuccess: { ar: "تم حفظ الأسعار بنجاح", en: "Prices saved successfully" },
    saveError: { ar: "فشل حفظ الأسعار", en: "Failed to save prices" },

    // Settings
    priceFeaturedRoomPerDay: { ar: "سعر تمييز الغرفة (لليوم)", en: "Featured Room Price (Per Day)" },
    priceVerification: { ar: "سعر التوثيق", en: "Verification Price" },

    currency: { ar: "ر.ع", en: "OMR" },
    save: { ar: "حفظ", en: "Save" },
    saving: { ar: "جاري الحفظ...", en: "Saving..." },
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
