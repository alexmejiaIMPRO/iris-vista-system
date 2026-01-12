package migrations

import (
	"log"

	"gorm.io/gorm"
	"vista-backend/internal/models"
	"vista-backend/internal/services"
)

// RunMigrations runs all database migrations
func RunMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.ProductImage{},
		&models.PurchaseRequest{},
		&models.RequestHistory{},
		&models.AmazonConfig{},
		&models.AuditLog{},
	)
	if err != nil {
		return err
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// SeedData seeds initial data into the database
func SeedData(db *gorm.DB) error {
	log.Println("Seeding initial data...")

	// Check if admin user exists
	var adminCount int64
	db.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&adminCount)
	if adminCount == 0 {
		// Create default admin user
		hashedPassword, err := services.HashPassword("admin123")
		if err != nil {
			return err
		}

		admin := models.User{
			Email:        "admin@company.com",
			PasswordHash: hashedPassword,
			Name:         "System Admin",
			Role:         models.RoleAdmin,
			CompanyCode:  "CC-001",
			CostCenter:   "CC-ADMIN",
			Department:   "IT",
			Status:       "active",
		}
		if err := db.Create(&admin).Error; err != nil {
			return err
		}
		log.Println("Created default admin user: admin@company.com / admin123")
	}

	// Seed sample users
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount <= 1 {
		sampleUsers := []models.User{
			{
				Email:        "gm@company.com",
				PasswordHash: mustHash("password123"),
				Name:         "John Smith",
				Role:         models.RoleGeneralManager,
				CompanyCode:  "CC-001",
				CostCenter:   "CC-1001",
				Department:   "Operations",
				Status:       "active",
			},
			{
				Email:        "scm@company.com",
				PasswordHash: mustHash("password123"),
				Name:         "Alice Wang",
				Role:         models.RoleSupplyChainManager,
				CompanyCode:  "CC-001",
				CostCenter:   "CC-2001",
				Department:   "Supply Chain",
				Status:       "active",
			},
			{
				Email:        "employee@company.com",
				PasswordHash: mustHash("password123"),
				Name:         "Bob Chen",
				Role:         models.RoleEmployee,
				CompanyCode:  "CC-001",
				CostCenter:   "CC-3001",
				Department:   "Engineering",
				Status:       "active",
			},
		}

		for _, user := range sampleUsers {
			db.Create(&user)
		}
		log.Println("Created sample users")
	}

	// Seed products (from existing CatalogPage data)
	var productCount int64
	db.Model(&models.Product{}).Count(&productCount)
	if productCount == 0 {
		products := []models.Product{
			// Office Supplies
			{SKU: "OF-001", Name: "Ballpoint Pen", NameZh: "圆珠笔", NameEs: "Bolígrafo", Category: "office", Model: "BP-100", Specification: "Blue ink, 0.7mm", SpecZh: "蓝色墨水，0.7mm", SpecEs: "Tinta azul, 0.7mm", Supplier: "OfficeMax", Price: 0.50, Stock: 2500, ImageEmoji: "🖊️", Source: models.SourceInternal, IsActive: true},
			{SKU: "OF-002", Name: "Notebook A5", NameZh: "A5笔记本", NameEs: "Cuaderno A5", Category: "office", Model: "NB-A5-80", Specification: "80 pages, ruled", SpecZh: "80页，横格", SpecEs: "80 páginas, rayado", Supplier: "Staples", Price: 2.99, Stock: 450, ImageEmoji: "📓", Source: models.SourceInternal, IsActive: true},
			{SKU: "OF-003", Name: "File Folder", NameZh: "文件夹", NameEs: "Carpeta de Archivos", Category: "office", Model: "FF-LETTER", Specification: "Letter size, manila", SpecZh: "信纸尺寸，牛皮纸色", SpecEs: "Tamaño carta, manila", Supplier: "OfficeMax", Price: 0.89, Stock: 800, ImageEmoji: "📁", Source: models.SourceInternal, IsActive: true},
			{SKU: "OF-004", Name: "Binder Clips", NameZh: "长尾夹", NameEs: "Clips de Carpeta", Category: "office", Model: "BC-25MM", Specification: "25mm, black", SpecZh: "25mm，黑色", SpecEs: "25mm, negro", Supplier: "Staples", Price: 3.50, Stock: 120, ImageEmoji: "🖇️", Source: models.SourceInternal, IsActive: true},
			{SKU: "OF-005", Name: "Stapler", NameZh: "订书机", NameEs: "Grapadora", Category: "office", Model: "ST-DESK", Specification: "Desktop, 20 sheets", SpecZh: "桌面型，20张", SpecEs: "Escritorio, 20 hojas", Supplier: "OfficeMax", Price: 8.99, Stock: 85, ImageEmoji: "📎", Source: models.SourceInternal, IsActive: true},
			{SKU: "OF-006", Name: "Sticky Notes", NameZh: "便利贴", NameEs: "Notas Adhesivas", Category: "office", Model: "SN-3X3", Specification: "3x3 inch, yellow", SpecZh: "3x3英寸，黄色", SpecEs: "3x3 pulgadas, amarillo", Supplier: "3M", Price: 4.25, Stock: 350, ImageEmoji: "📝", Source: models.SourceInternal, IsActive: true},

			// PPE
			{SKU: "PPE-001", Name: "Safety Shoes", NameZh: "安全鞋", NameEs: "Zapatos de Seguridad", Category: "ppe", Model: "SS-42-BLK", Specification: "Size 42, steel toe", SpecZh: "42码，钢头", SpecEs: "Talla 42, punta de acero", Supplier: "SafetyFirst", Price: 45.00, Stock: 65, ImageEmoji: "👞", Source: models.SourceInternal, IsActive: true},
			{SKU: "PPE-002", Name: "Safety Gloves", NameZh: "安全手套", NameEs: "Guantes de Seguridad", Category: "ppe", Model: "SG-L-NITRILE", Specification: "Size L, nitrile coated", SpecZh: "L码，丁腈涂层", SpecEs: "Talla L, recubierto de nitrilo", Supplier: "SafetyFirst", Price: 12.50, Stock: 450, ImageEmoji: "🧤", Source: models.SourceInternal, IsActive: true},
			{SKU: "PPE-003", Name: "Safety Goggles", NameZh: "护目镜", NameEs: "Gafas de Seguridad", Category: "ppe", Model: "SG-CLEAR", Specification: "Anti-fog, clear lens", SpecZh: "防雾，透明镜片", SpecEs: "Anti-vaho, lente transparente", Supplier: "SafetyFirst", Price: 8.99, Stock: 180, ImageEmoji: "🥽", Source: models.SourceInternal, IsActive: true},
			{SKU: "PPE-004", Name: "Hard Hat", NameZh: "安全帽", NameEs: "Casco de Seguridad", Category: "ppe", Model: "HH-YELLOW", Specification: "ANSI Z89.1, yellow", SpecZh: "ANSI Z89.1标准，黄色", SpecEs: "ANSI Z89.1, amarillo", Supplier: "SafetyFirst", Price: 18.00, Stock: 95, ImageEmoji: "⛑️", Source: models.SourceInternal, IsActive: true},
			{SKU: "PPE-005", Name: "Ear Plugs", NameZh: "耳塞", NameEs: "Tapones para Oídos", Category: "ppe", Model: "EP-FOAM-100", Specification: "Foam, 100 pairs", SpecZh: "泡沫，100对", SpecEs: "Espuma, 100 pares", Supplier: "3M", Price: 15.00, Stock: 220, ImageEmoji: "🔌", Source: models.SourceInternal, IsActive: true},

			// IT Equipment
			{SKU: "IT-001", Name: "Laptop - ThinkPad", NameZh: "笔记本电脑 - ThinkPad", NameEs: "Portátil - ThinkPad", Category: "it", Model: "TP-E14-I5", Specification: "Intel i5, 16GB RAM, 512GB SSD", SpecZh: "Intel i5，16GB内存，512GB固态硬盘", SpecEs: "Intel i5, 16GB RAM, 512GB SSD", Supplier: "Lenovo", Price: 899.00, Stock: 12, ImageEmoji: "💻", Source: models.SourceInternal, IsActive: true},
			{SKU: "IT-002", Name: "Laptop - Dell Latitude", NameZh: "笔记本电脑 - 戴尔Latitude", NameEs: "Portátil - Dell Latitude", Category: "it", Model: "DL-5520-I7", Specification: "Intel i7, 32GB RAM, 1TB SSD", SpecZh: "Intel i7，32GB内存，1TB固态硬盘", SpecEs: "Intel i7, 32GB RAM, 1TB SSD", Supplier: "Dell", Price: 1299.00, Stock: 8, ImageEmoji: "💻", Source: models.SourceInternal, IsActive: true},
			{SKU: "IT-003", Name: "Desktop PC", NameZh: "台式电脑", NameEs: "PC de Escritorio", Category: "it", Model: "HP-PRODESK-I5", Specification: "Intel i5, 16GB RAM, 256GB SSD", SpecZh: "Intel i5，16GB内存，256GB固态硬盘", SpecEs: "Intel i5, 16GB RAM, 256GB SSD", Supplier: "HP", Price: 699.00, Stock: 15, ImageEmoji: "🖥️", Source: models.SourceInternal, IsActive: true},
			{SKU: "IT-004", Name: "Mechanical Keyboard", NameZh: "机械键盘", NameEs: "Teclado Mecánico", Category: "it", Model: "KB-MECH-RGB", Specification: "Cherry MX Blue, RGB backlit", SpecZh: "Cherry MX青轴，RGB背光", SpecEs: "Cherry MX Blue, retroiluminación RGB", Supplier: "Logitech", Price: 89.00, Stock: 45, ImageEmoji: "⌨️", Source: models.SourceInternal, IsActive: true},
			{SKU: "IT-005", Name: "Wireless Mouse", NameZh: "无线鼠标", NameEs: "Ratón Inalámbrico", Category: "it", Model: "MS-MX-MASTER", Specification: "Ergonomic, 7 buttons", SpecZh: "人体工学，7键", SpecEs: "Ergonómico, 7 botones", Supplier: "Logitech", Price: 79.00, Stock: 75, ImageEmoji: "🖱️", Source: models.SourceInternal, IsActive: true},
			{SKU: "IT-006", Name: "24\" Monitor", NameZh: "24英寸显示器", NameEs: "Monitor 24\"", Category: "it", Model: "MON-24-FHD", Specification: "1920x1080, IPS, 75Hz", SpecZh: "1920x1080，IPS面板，75Hz", SpecEs: "1920x1080, IPS, 75Hz", Supplier: "Dell", Price: 179.00, Stock: 28, ImageEmoji: "🖥️", Source: models.SourceInternal, IsActive: true},
			{SKU: "IT-007", Name: "27\" Monitor", NameZh: "27英寸显示器", NameEs: "Monitor 27\"", Category: "it", Model: "MON-27-QHD", Specification: "2560x1440, IPS, 144Hz", SpecZh: "2560x1440，IPS面板，144Hz", SpecEs: "2560x1440, IPS, 144Hz", Supplier: "LG", Price: 329.00, Stock: 0, ImageEmoji: "🖥️", Source: models.SourceInternal, IsActive: true},

			// Cleaning Supplies
			{SKU: "CL-001", Name: "Mop", NameZh: "拖把", NameEs: "Trapeador", Category: "cleaning", Model: "MOP-MICRO", Specification: "Microfiber, extendable handle", SpecZh: "超细纤维，可伸缩手柄", SpecEs: "Microfibra, mango extensible", Supplier: "CleanPro", Price: 22.00, Stock: 55, ImageEmoji: "🧹", Source: models.SourceInternal, IsActive: true},
			{SKU: "CL-002", Name: "Hand Soap", NameZh: "洗手液", NameEs: "Jabón de Manos", Category: "cleaning", Model: "HS-PUMP-500ML", Specification: "500ml pump bottle, antibacterial", SpecZh: "500ml按压瓶，抗菌", SpecEs: "500ml botella con bomba, antibacterial", Supplier: "Softsoap", Price: 3.99, Stock: 320, ImageEmoji: "🧴", Source: models.SourceInternal, IsActive: true},
			{SKU: "CL-003", Name: "Paper Towels", NameZh: "纸巾", NameEs: "Toallas de Papel", Category: "cleaning", Model: "PT-12ROLL", Specification: "12 rolls, 2-ply", SpecZh: "12卷，双层", SpecEs: "12 rollos, 2 capas", Supplier: "Bounty", Price: 18.50, Stock: 180, ImageEmoji: "🧻", Source: models.SourceInternal, IsActive: true},
			{SKU: "CL-004", Name: "Toilet Paper", NameZh: "卫生纸", NameEs: "Papel Higiénico", Category: "cleaning", Model: "TP-24ROLL", Specification: "24 rolls, 3-ply, soft", SpecZh: "24卷，三层，柔软", SpecEs: "24 rollos, 3 capas, suave", Supplier: "Charmin", Price: 24.99, Stock: 95, ImageEmoji: "🧻", Source: models.SourceInternal, IsActive: true},
			{SKU: "CL-005", Name: "Toilet Cleaner", NameZh: "马桶清洁剂", NameEs: "Limpiador de Inodoros", Category: "cleaning", Model: "TC-GEL-750ML", Specification: "750ml gel, bleach formula", SpecZh: "750ml凝胶，漂白配方", SpecEs: "750ml gel, fórmula con lejía", Supplier: "Clorox", Price: 5.49, Stock: 140, ImageEmoji: "🚽", Source: models.SourceInternal, IsActive: true},
			{SKU: "CL-006", Name: "All-Purpose Cleaner", NameZh: "多用途清洁剂", NameEs: "Limpiador Multiusos", Category: "cleaning", Model: "APC-SPRAY-1L", Specification: "1L spray bottle", SpecZh: "1L喷雾瓶", SpecEs: "1L botella con pulverizador", Supplier: "Mr. Clean", Price: 4.99, Stock: 210, ImageEmoji: "🧽", Source: models.SourceInternal, IsActive: true},
		}

		for _, product := range products {
			product.Currency = "USD"
			db.Create(&product)
		}
		log.Println("Created sample products")
	}

	log.Println("Database seeding completed successfully")
	return nil
}

func mustHash(password string) string {
	hash, err := services.HashPassword(password)
	if err != nil {
		panic(err)
	}
	return hash
}
