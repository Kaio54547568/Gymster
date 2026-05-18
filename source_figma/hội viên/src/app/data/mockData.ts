// Mock data for Gym Member Portal

export const currentMember = {
  userId: 1001,
  memberId: "HV003",
  name: "Nguyễn Văn A",
  email: "nguyenvana@gmail.com",
  phone: "0912345678",
  dateOfBirth: "15/03/1995",
  gender: "Nam",
  address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
  packageId: "GYM6M",
  status: "Đang hoạt động",
  registrationDate: "10/04/2026",
  memberType: "Thành viên VIP",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenVanA"
};

export const packages = [
  {
    planCode: "GYM3M",
    title: "Gói Gym 3 tháng",
    durationDays: 90,
    duration: "3 tháng",
    isActive: true,
    price: 1500000,
    type: "Gym",
    sessions: 24,
    popular: false,
    hasPT: false,
    benefits: [
      "Tập gym không giới hạn",
      "Sử dụng phòng tập cơ bản",
      "Tư vấn dinh dưỡng cơ bản"
    ],
    terms: [
      "Không hoàn tiền sau khi kích hoạt",
      "Hủy lịch trước tối thiểu 2 giờ",
      "Gói có hiệu lực từ ngày thanh toán"
    ]
  },
  {
    planCode: "GYM6M",
    title: "Gói Gym 6 tháng",
    durationDays: 180,
    duration: "6 tháng",
    isActive: true,
    price: 3000000,
    type: "Gym",
    sessions: 48,
    popular: true,
    hasPT: false,
    benefits: [
      "Tập gym không giới hạn",
      "Sử dụng phòng cardio",
      "Hỗ trợ tư vấn dinh dưỡng cơ bản",
      "Được đặt lịch với HLV theo gói"
    ],
    terms: [
      "Không hoàn tiền sau khi kích hoạt",
      "Hủy lịch trước tối thiểu 2 giờ",
      "Gói có hiệu lực từ ngày thanh toán"
    ]
  },
  {
    planCode: "YOGA3M",
    title: "Gói Yoga 3 tháng",
    durationDays: 90,
    duration: "3 tháng",
    isActive: true,
    price: 2000000,
    type: "Yoga",
    sessions: 24,
    popular: false,
    hasPT: false,
    benefits: [
      "Tham gia lớp yoga nhóm",
      "Phòng tập yoga riêng",
      "Thảm tập miễn phí"
    ],
    terms: [
      "Không hoàn tiền sau khi kích hoạt",
      "Đặt lịch trước 1 ngày",
      "Tối đa 15 người/lớp"
    ]
  },
  {
    planCode: "VIPPT3M",
    title: "Gói VIP có PT",
    durationDays: 90,
    duration: "3 tháng",
    isActive: true,
    price: 5000000,
    type: "Gym + PT cá nhân",
    sessions: 24,
    popular: true,
    hasPT: true,
    benefits: [
      "Tập gym không giới hạn",
      "24 buổi tập với huấn luyện viên cá nhân",
      "Tư vấn dinh dưỡng",
      "Theo dõi tiến độ hàng tuần",
      "Ưu tiên đặt lịch giờ cao điểm"
    ],
    terms: [
      "Không hoàn tiền sau khi kích hoạt",
      "Hủy lịch trước tối thiểu 2 giờ",
      "Gói có hiệu lực từ ngày thanh toán",
      "PT cố định trong suốt khóa học"
    ]
  }
];

export const currentPackage = {
  planCode: "GYM6M",
  title: "Gói Gym 6 tháng",
  type: "Gym",
  status: "Đang hoạt động",
  registrationDate: "10/04/2026",
  expiryDate: "10/10/2026",
  totalSessions: 48,
  usedSessions: 36,
  remainingSessions: 12,
  daysRemaining: 30,
  price: 3000000,
  benefits: [
    "Tập gym không giới hạn",
    "Sử dụng phòng cardio",
    "Hỗ trợ tư vấn dinh dưỡng cơ bản",
    "Được đặt lịch với HLV theo gói"
  ]
};

export const trainers = [
  {
    id: 1,
    name: "Nguyễn Văn Nam",
    specialty: "Tăng cơ, Gym cá nhân, Strength Training",
    experience: 5,
    rating: 4.8,
    students: 120,
    availability: "Còn lịch trống",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenVanNam",
    bio: "Tôi chuyên hướng dẫn tăng cơ, cải thiện vóc dáng và xây dựng lịch tập cá nhân hóa cho từng học viên. Mục tiêu của tôi là giúp hội viên tập luyện an toàn, đúng kỹ thuật và duy trì thói quen lâu dài.",
    experienceDetails: [
      "5 năm huấn luyện cá nhân",
      "Từng làm việc tại Elite Fitness",
      "Đã hướng dẫn hơn 120 học viên",
      "Chuyên xây dựng giáo án tăng cơ và giảm mỡ"
    ],
    certifications: [
      {
        name: "Certified Personal Trainer",
        issuer: "NASM",
        year: 2022
      },
      {
        name: "Nutrition Coaching Certificate",
        issuer: "Precision Nutrition",
        year: 2023
      },
      {
        name: "Strength Training Specialist",
        issuer: "ACE",
        year: 2021
      }
    ],
    schedule: [
      { day: "Thứ hai", time: "18:00 - 19:00" },
      { day: "Thứ ba", time: "19:00 - 20:00" },
      { day: "Thứ năm", time: "17:00 - 18:00" },
      { day: "Thứ bảy", time: "08:00 - 09:00" }
    ],
    reviews: [
      {
        author: "Trần Văn B",
        rating: 5,
        comment: "HLV hướng dẫn rất kỹ, sửa form tốt.",
        date: "10/05/2026"
      },
      {
        author: "Lê Thị C",
        rating: 5,
        comment: "Bài tập phù hợp, có theo dõi tiến độ.",
        date: "05/05/2026"
      },
      {
        author: "Phạm Văn D",
        rating: 4,
        comment: "Nhiệt tình và dễ trao đổi.",
        date: "01/05/2026"
      }
    ]
  },
  {
    id: 2,
    name: "Trần Minh Đức",
    specialty: "Giảm cân, Cardio, HIIT",
    experience: 4,
    rating: 4.7,
    students: 95,
    availability: "Còn lịch trống",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TranMinhDuc",
    bio: "Chuyên gia về giảm cân và cardio với phương pháp tập luyện khoa học, hiệu quả. Tôi cam kết giúp học viên đạt được mục tiêu giảm cân một cách bền vững.",
    experienceDetails: [
      "4 năm kinh nghiệm huấn luyện",
      "Chuyên về cardio và HIIT",
      "Đã giúp 95 học viên đạt mục tiêu",
      "Tư vấn chế độ ăn giảm cân"
    ],
    certifications: [
      {
        name: "Cardio Specialist",
        issuer: "ACE",
        year: 2022
      },
      {
        name: "Weight Loss Coach",
        issuer: "ISSA",
        year: 2023
      }
    ],
    schedule: [
      { day: "Thứ ba", time: "17:00 - 18:00" },
      { day: "Thứ tư", time: "18:00 - 19:00" },
      { day: "Thứ sáu", time: "19:00 - 20:00" }
    ],
    reviews: [
      {
        author: "Hoàng Thị E",
        rating: 5,
        comment: "Giảm được 10kg sau 3 tháng tập.",
        date: "08/05/2026"
      }
    ]
  },
  {
    id: 3,
    name: "Lê Thu Hà",
    specialty: "Yoga, Phục hồi thể lực, Pilates",
    experience: 6,
    rating: 4.9,
    students: 150,
    availability: "Kín lịch",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LeThuhHa",
    bio: "Huấn luyện viên Yoga với hơn 6 năm kinh nghiệm. Tôi giúp học viên cải thiện sức khỏe tinh thần và thể chất thông qua các bài tập yoga, pilates và phục hồi chức năng.",
    experienceDetails: [
      "6 năm giảng dạy yoga",
      "Chứng chỉ yoga quốc tế",
      "150 học viên thường xuyên",
      "Chuyên yoga trị liệu"
    ],
    certifications: [
      {
        name: "Yoga Teacher Training 200h",
        issuer: "Yoga Alliance",
        year: 2020
      },
      {
        name: "Pilates Instructor",
        issuer: "STOTT Pilates",
        year: 2021
      }
    ],
    schedule: [],
    reviews: [
      {
        author: "Nguyễn Thị F",
        rating: 5,
        comment: "Cô dạy rất tận tâm và chi tiết.",
        date: "12/05/2026"
      }
    ]
  }
];

export const upcomingWorkouts = [
  {
    id: 1,
    title: "Gym cá nhân - Tập ngực và tay sau",
    type: "Gym cá nhân",
    time: "18:00 - 19:00",
    date: "Thứ ba, 12/05/2026",
    trainer: "Nguyễn Văn Nam",
    room: "Phòng Gym tầng 2",
    status: "Sắp tới"
  }
];

export const workoutHistory = [
  {
    historyId: 1,
    memberId: "HV003",
    exerciseName: "Gym cá nhân - Tập ngực và tay sau",
    duration: 60,
    caloriesBurned: 320,
    trainingDate: "12/05/2026",
    trainer: "Nguyễn Văn Nam",
    status: "Đã hoàn thành",
    exercises: [
      { name: "Khởi động", sets: 1, reps: "10 phút" },
      { name: "Bench Press", sets: 4, reps: "10 lần" },
      { name: "Dumbbell Fly", sets: 3, reps: "12 lần" },
      { name: "Triceps Pushdown", sets: 3, reps: "12 lần" },
      { name: "Plank", sets: 3, reps: "45 giây" },
      { name: "Giãn cơ cuối buổi", sets: 1, reps: "5 phút" }
    ],
    goal: "Tăng sức mạnh phần thân trên",
    muscleGroups: "Ngực, tay sau, vai trước",
    notes: "Tập trung kiểm soát kỹ thuật, không tăng tạ quá nhanh."
  },
  {
    historyId: 2,
    memberId: "HV003",
    exerciseName: "Cardio đốt mỡ",
    duration: 45,
    caloriesBurned: 410,
    trainingDate: "10/05/2026",
    trainer: "",
    status: "Đã hoàn thành",
    exercises: [
      { name: "Khởi động", sets: 1, reps: "5 phút" },
      { name: "Chạy bộ", sets: 1, reps: "20 phút" },
      { name: "Xe đạp", sets: 1, reps: "15 phút" },
      { name: "Giãn cơ", sets: 1, reps: "5 phút" }
    ],
    goal: "Đốt cháy calo, tăng sức bền",
    muscleGroups: "Toàn thân",
    notes: ""
  },
  {
    historyId: 3,
    memberId: "HV003",
    exerciseName: "Yoga giãn cơ",
    duration: 60,
    caloriesBurned: 180,
    trainingDate: "08/05/2026",
    trainer: "Lê Thu Hà",
    status: "Đã hoàn thành",
    exercises: [
      { name: "Thở và định tâm", sets: 1, reps: "5 phút" },
      { name: "Sun Salutation", sets: 3, reps: "10 lần" },
      { name: "Warrior Pose", sets: 2, reps: "30 giây/bên" },
      { name: "Child Pose", sets: 1, reps: "2 phút" },
      { name: "Shavasana", sets: 1, reps: "5 phút" }
    ],
    goal: "Giãn cơ toàn thân, thư giãn",
    muscleGroups: "Toàn thân",
    notes: "Tập trung vào hơi thở và cảm nhận cơ thể."
  },
  {
    historyId: 4,
    memberId: "HV003",
    exerciseName: "Tập chân - Lower Body",
    duration: 70,
    caloriesBurned: 450,
    trainingDate: "06/05/2026",
    trainer: "Trần Minh Đức",
    status: "Đã hoàn thành",
    exercises: [
      { name: "Khởi động", sets: 1, reps: "10 phút" },
      { name: "Squat", sets: 4, reps: "12 lần" },
      { name: "Leg Press", sets: 4, reps: "10 lần" },
      { name: "Lunges", sets: 3, reps: "12 lần/chân" },
      { name: "Calf Raises", sets: 3, reps: "15 lần" },
      { name: "Giãn cơ", sets: 1, reps: "5 phút" }
    ],
    goal: "Tăng sức mạnh chân và mông",
    muscleGroups: "Chân, mông",
    notes: "Form tốt, tiếp tục duy trì."
  }
];

export const reviews = [
  {
    reviewId: "RV001",
    authorId: "HV003",
    ratingStars: 5,
    comment: "HLV hướng dẫn rất kỹ, sửa form tốt.",
    createdAt: "12/05/2026 20:00",
    target: "Huấn luyện viên",
    targetName: "Nguyễn Văn Nam",
    status: "Đã xử lý"
  },
  {
    reviewId: "RV002",
    authorId: "HV003",
    ratingStars: 4,
    comment: "Phòng tập sạch, thiết bị đầy đủ.",
    createdAt: "10/05/2026 19:30",
    target: "Phòng tập",
    targetName: "Phòng Gym tầng 2",
    status: "Đã xử lý"
  }
];

export const calendarEvents = [
  {
    id: 1,
    date: "2026-05-12",
    time: "18:00",
    title: "Gym với PT Nam",
    trainer: "Nguyễn Văn Nam",
    status: "Sắp tới",
    type: "Gym cá nhân",
    room: "Phòng Gym tầng 2",
    notes: "Tập trung vào kỹ thuật",
    goal: "Tăng sức mạnh",
    duration: 60,
    caloriesBurned: 320,
    muscleGroups: "Ngực, tay sau",
    hasReview: false,
    exercises: [
      { name: "Khởi động", sets: 1, reps: "10 phút" },
      { name: "Bench Press", sets: 4, reps: "10 lần" },
      { name: "Triceps Dips", sets: 3, reps: "12 lần" },
      { name: "Giãn cơ", sets: 1, reps: "5 phút" }
    ]
  },
  {
    id: 2,
    date: "2026-05-13",
    time: "19:30",
    title: "Yoga nhóm",
    trainer: "Lê Thu Hà",
    status: "Sắp tới",
    type: "Yoga",
    room: "Phòng Yoga tầng 3",
    notes: "Nhớ mang thảm tập",
    goal: "Thư giãn và giãn cơ",
    duration: 60,
    caloriesBurned: 180,
    muscleGroups: "Toàn thân",
    hasReview: false,
    exercises: [
      { name: "Hơi thở cơ bản", sets: 1, reps: "5 phút" },
      { name: "Tư thế mặt trời", sets: 3, reps: "10 lần" },
      { name: "Tư thế cây", sets: 2, reps: "1 phút" },
      { name: "Thiền định", sets: 1, reps: "10 phút" }
    ]
  },
  {
    id: 3,
    date: "2026-05-14",
    time: "08:00",
    title: "Cardio",
    trainer: "",
    status: "Chờ xác nhận",
    type: "Cardio",
    room: "Khu Cardio",
    notes: "Yêu cầu đặt lịch sáng sớm",
    goal: "Đốt cháy calo",
    duration: 45,
    caloriesBurned: 350,
    muscleGroups: "Tim mạch",
    hasReview: false,
    exercises: [
      { name: "Chạy bộ", sets: 1, reps: "20 phút" },
      { name: "Xe đạp", sets: 1, reps: "15 phút" },
      { name: "Giãn cơ", sets: 1, reps: "10 phút" }
    ]
  },
  {
    id: 4,
    date: "2026-05-15",
    time: "17:00",
    title: "Tập chân",
    trainer: "Trần Minh Đức",
    status: "Sắp tới",
    type: "Gym cá nhân",
    room: "Phòng Gym tầng 2",
    notes: "Tăng tải lượng so với tuần trước",
    goal: "Tăng sức mạnh chân",
    duration: 70,
    caloriesBurned: 450,
    muscleGroups: "Chân, mông",
    hasReview: false,
    exercises: [
      { name: "Khởi động", sets: 1, reps: "10 phút" },
      { name: "Squat", sets: 4, reps: "12 lần" },
      { name: "Leg Press", sets: 4, reps: "10 lần" },
      { name: "Lunges", sets: 3, reps: "12 lần/chân" },
      { name: "Giãn cơ", sets: 1, reps: "5 phút" }
    ]
  },
  {
    id: 5,
    date: "2026-05-10",
    time: "18:00",
    title: "Cardio đốt mỡ",
    trainer: "",
    status: "Đã hoàn thành",
    type: "Cardio",
    room: "Khu Cardio",
    notes: "Tập tốt, duy trì tốc độ ổn định",
    goal: "Giảm mỡ",
    duration: 45,
    caloriesBurned: 380,
    muscleGroups: "Tim mạch",
    hasReview: true,
    exercises: [
      { name: "Chạy bộ", sets: 1, reps: "25 phút" },
      { name: "Xe đạp", sets: 1, reps: "15 phút" },
      { name: "Giãn cơ", sets: 1, reps: "5 phút" }
    ]
  },
  {
    id: 6,
    date: "2026-05-08",
    time: "19:00",
    title: "Yoga giãn cơ",
    trainer: "Lê Thu Hà",
    status: "Đã hoàn thành",
    type: "Yoga",
    room: "Phòng Yoga tầng 3",
    notes: "Tập trung vào hơi thở",
    goal: "Thư giãn",
    duration: 60,
    caloriesBurned: 150,
    muscleGroups: "Toàn thân",
    hasReview: false,
    exercises: [
      { name: "Hơi thở sâu", sets: 1, reps: "10 phút" },
      { name: "Tư thế mèo-bò", sets: 3, reps: "10 lần" },
      { name: "Tư thế con chim", sets: 2, reps: "30 giây" },
      { name: "Thiền cuối buổi", sets: 1, reps: "10 phút" }
    ]
  },
  {
    id: 7,
    date: "2026-05-07",
    time: "07:00",
    title: "Gym sáng sớm",
    trainer: "Nguyễn Văn Nam",
    status: "Đã hủy",
    type: "Gym cá nhân",
    room: "Phòng Gym tầng 2",
    notes: "Đã hủy do bận việc đột xuất",
    goal: "Tập toàn thân",
    duration: 60,
    caloriesBurned: 300,
    muscleGroups: "Toàn thân",
    hasReview: false,
    exercises: [
      { name: "Khởi động", sets: 1, reps: "10 phút" },
      { name: "Bài tập chính", sets: 3, reps: "12 lần" },
      { name: "Giãn cơ", sets: 1, reps: "5 phút" }
    ]
  }
];

export const notifications = [
  {
    id: 1,
    message: "Gói tập của bạn còn 30 ngày",
    type: "warning",
    date: "12/05/2026"
  },
  {
    id: 2,
    message: "Bạn có lịch tập với PT Nam lúc 18:00 hôm nay",
    type: "info",
    date: "12/05/2026"
  }
];

export const stats = {
  monthlyWorkouts: 12,
  totalCalories: 3840,
  remainingSessions: 12,
  daysRemaining: 30
};
