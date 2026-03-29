db = db.getSiblingDB('eventzen_venue');

db.venues.createIndex({ "address.city": 1 });
db.venues.createIndex({ location: "2dsphere" });
db.venues.createIndex({ is_active: 1 });
db.venues.createIndex({ name: "text", "address.city": "text" });

db.venue_bookings.createIndex({ venue_id: 1, hall_id: 1, booking_start: 1, booking_end: 1 });
db.venue_bookings.createIndex({ event_id: 1 });
db.venue_bookings.createIndex({ status: 1 });

db.vendors.createIndex({ service_type: 1 });
db.vendors.createIndex({ rating_average: -1 });
db.vendors.createIndex({ name: "text" });

db.event_vendors.createIndex({ event_id: 1, vendor_id: 1 });

const now = new Date();

const venues = [
	{
		name: "Gateway Grand Convention Centre",
		description: "Premium waterfront convention venue ideal for expos, conferences, and large-scale corporate events.",
		address: { street: "Apollo Bunder", city: "Mumbai", state: "Maharashtra", country: "India", zip: "400001" },
		location: { type: "Point", coordinates: [72.8347, 18.922] },
		total_capacity: 1800,
		halls: [
			{ hall_id: "GW-MUM-1", name: "Marine Ballroom", capacity: 1200, amenities: ["LED Wall", "Stage", "Sound Console"], hourly_rate: 18000, floor: 1 },
			{ hall_id: "GW-MUM-2", name: "Harbor Hall", capacity: 600, amenities: ["Projector", "Breakout Space", "Wi-Fi"], hourly_rate: 11000, floor: 2 },
		],
		amenities: ["Valet Parking", "Catering", "Backup Power", "High-Speed Wi-Fi", "Security Desk"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/mumbai-gateway-1/1400/900", caption: "Main facade", type: "image" },
			{ url: "https://picsum.photos/seed/mumbai-gateway-2/1400/900", caption: "Convention hall", type: "image" },
		],
		pricing: { base_rate: 250000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Ananya Mehta", email: "bookings@gatewaygrand.in", phone: "+91-9876543001" },
		is_active: true,
		rating_average: 4.6,
		rating_count: 184,
	},
	{
		name: "Rajpath Summit Hall",
		description: "Central Delhi venue with modular halls for policy summits, business meets, and ceremonies.",
		address: { street: "C Hexagon", city: "New Delhi", state: "Delhi", country: "India", zip: "110001" },
		location: { type: "Point", coordinates: [77.2295, 28.6129] },
		total_capacity: 1400,
		halls: [
			{ hall_id: "RP-DEL-1", name: "Constitution Hall", capacity: 900, amenities: ["Stage", "AV Control", "Hybrid Streaming"], hourly_rate: 15000, floor: 1 },
			{ hall_id: "RP-DEL-2", name: "Capital Chamber", capacity: 500, amenities: ["Conference Lighting", "PA System"], hourly_rate: 9000, floor: 2 },
		],
		amenities: ["Metro Access", "Catering", "VIP Lounge", "On-site Tech Team"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/delhi-rajpath-1/1400/900", caption: "Entrance plaza", type: "image" },
			{ url: "https://picsum.photos/seed/delhi-rajpath-2/1400/900", caption: "Main auditorium", type: "image" },
		],
		pricing: { base_rate: 210000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Raghav Sharma", email: "events@rajpathsummit.in", phone: "+91-9876543002" },
		is_active: true,
		rating_average: 4.5,
		rating_count: 139,
	},
	{
		name: "Silicon Valley Expo Dome",
		description: "Tech-focused expo venue with high-capacity networking spaces and startup demo zones.",
		address: { street: "Outer Ring Road", city: "Bengaluru", state: "Karnataka", country: "India", zip: "560103" },
		location: { type: "Point", coordinates: [77.6963, 12.9279] },
		total_capacity: 2200,
		halls: [
			{ hall_id: "SV-BLR-1", name: "Innovation Arena", capacity: 1500, amenities: ["LED Backdrop", "Demo Pods", "Acoustic Panels"], hourly_rate: 20000, floor: 1 },
			{ hall_id: "SV-BLR-2", name: "Founder Forum", capacity: 700, amenities: ["Townhall Setup", "Streaming Kit"], hourly_rate: 12500, floor: 2 },
		],
		amenities: ["EV Charging", "Food Court", "Fiber Internet", "Medical Room"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/bengaluru-silicon-1/1400/900", caption: "Expo floor", type: "image" },
			{ url: "https://picsum.photos/seed/bengaluru-silicon-2/1400/900", caption: "Networking lounge", type: "image" },
		],
		pricing: { base_rate: 290000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Kavya Rao", email: "connect@silicondome.in", phone: "+91-9876543003" },
		is_active: true,
		rating_average: 4.7,
		rating_count: 201,
	},
	{
		name: "Hussain Lakeside Events",
		description: "Scenic lakeside property for business conclaves, weddings, and premium evening events.",
		address: { street: "Tank Bund Road", city: "Hyderabad", state: "Telangana", country: "India", zip: "500080" },
		location: { type: "Point", coordinates: [78.4738, 17.4239] },
		total_capacity: 1300,
		halls: [
			{ hall_id: "HL-HYD-1", name: "Nizam Hall", capacity: 850, amenities: ["Chandelier Lighting", "Modular Stage"], hourly_rate: 13000, floor: 1 },
			{ hall_id: "HL-HYD-2", name: "Pearl Pavilion", capacity: 450, amenities: ["Garden Access", "PA System"], hourly_rate: 8000, floor: 1 },
		],
		amenities: ["Lake View Deck", "Catering", "Power Backup", "Parking"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/hyderabad-lakeside-1/1400/900", caption: "Lakeside view", type: "image" },
			{ url: "https://picsum.photos/seed/hyderabad-lakeside-2/1400/900", caption: "Banquet setup", type: "image" },
		],
		pricing: { base_rate: 175000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Mohit Reddy", email: "sales@hussainlakeside.in", phone: "+91-9876543004" },
		is_active: true,
		rating_average: 4.4,
		rating_count: 112,
	},
	{
		name: "Marina Bay Conference Hub",
		description: "Coastal conference center near Marina with seamless setup for enterprise summits.",
		address: { street: "Kamarajar Salai", city: "Chennai", state: "Tamil Nadu", country: "India", zip: "600005" },
		location: { type: "Point", coordinates: [80.2834, 13.0475] },
		total_capacity: 1600,
		halls: [
			{ hall_id: "MB-CHN-1", name: "Coromandel Hall", capacity: 1000, amenities: ["Projection Mapping", "Surround Audio"], hourly_rate: 14500, floor: 2 },
			{ hall_id: "MB-CHN-2", name: "Bay Chamber", capacity: 600, amenities: ["Breakout Pods", "Digital Signage"], hourly_rate: 9800, floor: 3 },
		],
		amenities: ["Valet", "In-house Decor", "CCTV", "High-Speed Wi-Fi"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/chennai-marina-1/1400/900", caption: "Conference entry", type: "image" },
			{ url: "https://picsum.photos/seed/chennai-marina-2/1400/900", caption: "Main hall", type: "image" },
		],
		pricing: { base_rate: 205000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Priya Narayanan", email: "hello@marinabayhub.in", phone: "+91-9876543005" },
		is_active: true,
		rating_average: 4.5,
		rating_count: 128,
	},
	{
		name: "Hooghly Riverside Convention",
		description: "Large-format convention center with heritage-inspired interiors and modern AV infrastructure.",
		address: { street: "Strand Road", city: "Kolkata", state: "West Bengal", country: "India", zip: "700001" },
		location: { type: "Point", coordinates: [88.3495, 22.5726] },
		total_capacity: 1700,
		halls: [
			{ hall_id: "HR-KOL-1", name: "Victoria Hall", capacity: 1100, amenities: ["Grand Stage", "Control Room"], hourly_rate: 15000, floor: 1 },
			{ hall_id: "HR-KOL-2", name: "Howrah Suite", capacity: 600, amenities: ["Boardroom Setup", "Smart Lighting"], hourly_rate: 9200, floor: 2 },
		],
		amenities: ["Riverfront Deck", "Catering", "Generator Backup", "Wheelchair Access"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/kolkata-riverside-1/1400/900", caption: "Riverside facade", type: "image" },
			{ url: "https://picsum.photos/seed/kolkata-riverside-2/1400/900", caption: "Event floor", type: "image" },
		],
		pricing: { base_rate: 215000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Subhajit Sen", email: "bookings@hooghlyconvention.in", phone: "+91-9876543006" },
		is_active: true,
		rating_average: 4.5,
		rating_count: 147,
	},
	{
		name: "Sahyadri Event Palace",
		description: "Versatile event property for concerts, conventions, and product launches in Pune tech corridor.",
		address: { street: "Baner Road", city: "Pune", state: "Maharashtra", country: "India", zip: "411045" },
		location: { type: "Point", coordinates: [73.7898, 18.559] },
		total_capacity: 1200,
		halls: [
			{ hall_id: "SP-PUN-1", name: "Deccan Hall", capacity: 750, amenities: ["Truss Rigging", "AV Booth"], hourly_rate: 10500, floor: 1 },
			{ hall_id: "SP-PUN-2", name: "Plateau Lounge", capacity: 450, amenities: ["Cocktail Setup", "Projection"], hourly_rate: 7400, floor: 2 },
		],
		amenities: ["Parking", "Wi-Fi", "Green Rooms", "Loading Dock"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/pune-sahyadri-1/1400/900", caption: "Main gate", type: "image" },
			{ url: "https://picsum.photos/seed/pune-sahyadri-2/1400/900", caption: "Indoor stage", type: "image" },
		],
		pricing: { base_rate: 155000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Neeraj Kulkarni", email: "events@sahyadripalace.in", phone: "+91-9876543007" },
		is_active: true,
		rating_average: 4.3,
		rating_count: 95,
	},
	{
		name: "Sabarmati Signature Center",
		description: "Modern multipurpose venue with riverfront access and integrated event management support.",
		address: { street: "Riverfront West", city: "Ahmedabad", state: "Gujarat", country: "India", zip: "380009" },
		location: { type: "Point", coordinates: [72.5714, 23.0225] },
		total_capacity: 1100,
		halls: [
			{ hall_id: "SS-AHM-1", name: "Heritage Hall", capacity: 700, amenities: ["Stage", "LED Screens"], hourly_rate: 9800, floor: 1 },
			{ hall_id: "SS-AHM-2", name: "Kite Pavilion", capacity: 400, amenities: ["Meeting Pods", "Audio Setup"], hourly_rate: 6500, floor: 1 },
		],
		amenities: ["In-house Decor", "Catering", "Power Backup", "Security"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/ahmedabad-sabarmati-1/1400/900", caption: "Riverfront side", type: "image" },
			{ url: "https://picsum.photos/seed/ahmedabad-sabarmati-2/1400/900", caption: "Hall interior", type: "image" },
		],
		pricing: { base_rate: 138000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Hetal Patel", email: "hello@sabarmatisignature.in", phone: "+91-9876543008" },
		is_active: true,
		rating_average: 4.4,
		rating_count: 101,
	},
	{
		name: "Pink City Royal Arena",
		description: "Rajasthani-inspired venue for destination events, galas, and cultural showcases.",
		address: { street: "MI Road", city: "Jaipur", state: "Rajasthan", country: "India", zip: "302001" },
		location: { type: "Point", coordinates: [75.7873, 26.9124] },
		total_capacity: 1250,
		halls: [
			{ hall_id: "PC-JAI-1", name: "Amber Court", capacity: 800, amenities: ["Grand Stage", "Ambient Lighting"], hourly_rate: 10200, floor: 1 },
			{ hall_id: "PC-JAI-2", name: "Hawa Mahal Suite", capacity: 450, amenities: ["Private Entry", "PA System"], hourly_rate: 6900, floor: 1 },
		],
		amenities: ["Traditional Decor", "Valet", "Bridal Suite", "Power Backup"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/jaipur-royal-1/1400/900", caption: "Courtyard", type: "image" },
			{ url: "https://picsum.photos/seed/jaipur-royal-2/1400/900", caption: "Banquet setup", type: "image" },
		],
		pricing: { base_rate: 148000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Ishita Singh", email: "bookings@pinkcityarena.in", phone: "+91-9876543009" },
		is_active: true,
		rating_average: 4.4,
		rating_count: 118,
	},
	{
		name: "Malabar Coast Convention Hall",
		description: "Elegant coastal convention venue tailored for corporate meets and destination events.",
		address: { street: "Marine Drive", city: "Kochi", state: "Kerala", country: "India", zip: "682011" },
		location: { type: "Point", coordinates: [76.2673, 9.9312] },
		total_capacity: 950,
		halls: [
			{ hall_id: "MC-KOC-1", name: "Spice Hall", capacity: 600, amenities: ["Stage", "Digital Mixer"], hourly_rate: 8200, floor: 1 },
			{ hall_id: "MC-KOC-2", name: "Harbor Deck", capacity: 350, amenities: ["Open Terrace", "Light Rig"], hourly_rate: 6000, floor: 2 },
		],
		amenities: ["Sea View", "Parking", "Catering", "Wi-Fi"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/kochi-malabar-1/1400/900", caption: "Venue exterior", type: "image" },
			{ url: "https://picsum.photos/seed/kochi-malabar-2/1400/900", caption: "Conference setup", type: "image" },
		],
		pricing: { base_rate: 118000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Sanjay Nair", email: "events@malabarcoast.in", phone: "+91-9876543010" },
		is_active: true,
		rating_average: 4.3,
		rating_count: 88,
	},
	{
		name: "Shivalik Business Venue",
		description: "North India corporate venue optimized for conferences, networking evenings, and product showcases.",
		address: { street: "Sector 17", city: "Chandigarh", state: "Chandigarh", country: "India", zip: "160017" },
		location: { type: "Point", coordinates: [76.7794, 30.7333] },
		total_capacity: 900,
		halls: [
			{ hall_id: "SB-CHD-1", name: "Pine Hall", capacity: 550, amenities: ["Conference AV", "Recording Setup"], hourly_rate: 7600, floor: 1 },
			{ hall_id: "SB-CHD-2", name: "Maple Room", capacity: 350, amenities: ["Boardroom Layout", "Presentation Wall"], hourly_rate: 5400, floor: 2 },
		],
		amenities: ["Parking", "Business Lounge", "High-Speed Wi-Fi", "Security"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/chandigarh-shivalik-1/1400/900", caption: "Front view", type: "image" },
			{ url: "https://picsum.photos/seed/chandigarh-shivalik-2/1400/900", caption: "Meeting hall", type: "image" },
		],
		pricing: { base_rate: 102000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Manpreet Kaur", email: "info@shivalikvenue.in", phone: "+91-9876543011" },
		is_active: true,
		rating_average: 4.2,
		rating_count: 76,
	},
	{
		name: "Central India Convention Park",
		description: "High-utility convention park for exhibitions, government meets, and educational summits.",
		address: { street: "AB Road", city: "Indore", state: "Madhya Pradesh", country: "India", zip: "452001" },
		location: { type: "Point", coordinates: [75.8577, 22.7196] },
		total_capacity: 1150,
		halls: [
			{ hall_id: "CI-IND-1", name: "Malwa Hall", capacity: 700, amenities: ["Stage", "Sound System"], hourly_rate: 8400, floor: 1 },
			{ hall_id: "CI-IND-2", name: "Rajwada Suite", capacity: 450, amenities: ["Projection", "Meeting Pods"], hourly_rate: 6100, floor: 1 },
		],
		amenities: ["Parking", "Cafeteria", "Generator", "Security"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/indore-central-1/1400/900", caption: "Main block", type: "image" },
			{ url: "https://picsum.photos/seed/indore-central-2/1400/900", caption: "Exhibition zone", type: "image" },
		],
		pricing: { base_rate: 126000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Aditya Jain", email: "book@centralconventionpark.in", phone: "+91-9876543012" },
		is_active: true,
		rating_average: 4.3,
		rating_count: 83,
	},
	{
		name: "Awadh Imperial Hall",
		description: "Classic and contemporary mixed venue suited for seminars, social events, and leadership meets.",
		address: { street: "Hazratganj", city: "Lucknow", state: "Uttar Pradesh", country: "India", zip: "226001" },
		location: { type: "Point", coordinates: [80.9462, 26.8467] },
		total_capacity: 1000,
		halls: [
			{ hall_id: "AI-LKO-1", name: "Nawab Hall", capacity: 650, amenities: ["LED Wall", "AV Console"], hourly_rate: 8200, floor: 1 },
			{ hall_id: "AI-LKO-2", name: "Imambara Room", capacity: 350, amenities: ["Flexible Seating", "PA System"], hourly_rate: 5700, floor: 2 },
		],
		amenities: ["Valet", "Catering", "Power Backup", "Bridal Room"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/lucknow-awadh-1/1400/900", caption: "Venue lobby", type: "image" },
			{ url: "https://picsum.photos/seed/lucknow-awadh-2/1400/900", caption: "Main hall", type: "image" },
		],
		pricing: { base_rate: 119000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Saif Rizvi", email: "events@awadhimperial.in", phone: "+91-9876543013" },
		is_active: true,
		rating_average: 4.2,
		rating_count: 79,
	},
	{
		name: "Goa Bayfront Event Deck",
		description: "Beach-adjacent event venue for destination conferences, music nights, and private celebrations.",
		address: { street: "Miramar", city: "Panaji", state: "Goa", country: "India", zip: "403001" },
		location: { type: "Point", coordinates: [73.8278, 15.4909] },
		total_capacity: 850,
		halls: [
			{ hall_id: "GB-PNJ-1", name: "Sunset Hall", capacity: 500, amenities: ["Open Air Stage", "Light Rig"], hourly_rate: 9100, floor: 1 },
			{ hall_id: "GB-PNJ-2", name: "Coast Lounge", capacity: 350, amenities: ["Deck Seating", "Sound Setup"], hourly_rate: 6800, floor: 1 },
		],
		amenities: ["Sea View", "Catering", "Parking", "Security"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/goa-bayfront-1/1400/900", caption: "Bayfront exterior", type: "image" },
			{ url: "https://picsum.photos/seed/goa-bayfront-2/1400/900", caption: "Night event", type: "image" },
		],
		pricing: { base_rate: 142000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Raina D'Souza", email: "bookings@goabayfront.in", phone: "+91-9876543014" },
		is_active: true,
		rating_average: 4.5,
		rating_count: 121,
	},
	{
		name: "Kalinga Convention Square",
		description: "Contemporary event square for business conventions and cultural festivals.",
		address: { street: "Janpath", city: "Bhubaneswar", state: "Odisha", country: "India", zip: "751001" },
		location: { type: "Point", coordinates: [85.8245, 20.2961] },
		total_capacity: 980,
		halls: [
			{ hall_id: "KC-BBS-1", name: "Utkal Hall", capacity: 620, amenities: ["Stage", "Digital Mixer"], hourly_rate: 7900, floor: 1 },
			{ hall_id: "KC-BBS-2", name: "Temple City Room", capacity: 360, amenities: ["Projection", "Hybrid Setup"], hourly_rate: 5600, floor: 2 },
		],
		amenities: ["Power Backup", "Parking", "Wi-Fi", "Cafeteria"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/bhubaneswar-kalinga-1/1400/900", caption: "Convention square", type: "image" },
			{ url: "https://picsum.photos/seed/bhubaneswar-kalinga-2/1400/900", caption: "Hall setup", type: "image" },
		],
		pricing: { base_rate: 109000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Debashish Nayak", email: "hello@kalingasquare.in", phone: "+91-9876543015" },
		is_active: true,
		rating_average: 4.3,
		rating_count: 82,
	},
	{
		name: "Brahmaputra Grand Hall",
		description: "High-capacity event complex for conferences, trade meets, and large community functions.",
		address: { street: "GS Road", city: "Guwahati", state: "Assam", country: "India", zip: "781005" },
		location: { type: "Point", coordinates: [91.7362, 26.1445] },
		total_capacity: 1050,
		halls: [
			{ hall_id: "BG-GHY-1", name: "River Hall", capacity: 650, amenities: ["LED Wall", "Sound Desk"], hourly_rate: 8000, floor: 1 },
			{ hall_id: "BG-GHY-2", name: "Tea Garden Suite", capacity: 400, amenities: ["Conference Seating", "Projector"], hourly_rate: 5900, floor: 2 },
		],
		amenities: ["Parking", "Security", "Catering", "Power Backup"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/guwahati-brahmaputra-1/1400/900", caption: "Main block", type: "image" },
			{ url: "https://picsum.photos/seed/guwahati-brahmaputra-2/1400/900", caption: "Indoor event", type: "image" },
		],
		pricing: { base_rate: 114000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Niharika Bora", email: "events@brahmaputrahall.in", phone: "+91-9876543016" },
		is_active: true,
		rating_average: 4.2,
		rating_count: 69,
	},
	{
		name: "Surat Diamond Convention",
		description: "Elegant venue designed for trade expos, investor summits, and premium business gatherings.",
		address: { street: "Ring Road", city: "Surat", state: "Gujarat", country: "India", zip: "395002" },
		location: { type: "Point", coordinates: [72.8311, 21.1702] },
		total_capacity: 1080,
		halls: [
			{ hall_id: "SD-SRT-1", name: "Diamond Hall", capacity: 680, amenities: ["Stage", "Projection", "AV Desk"], hourly_rate: 8600, floor: 1 },
			{ hall_id: "SD-SRT-2", name: "Textile Chamber", capacity: 400, amenities: ["Breakout Rooms", "PA System"], hourly_rate: 6200, floor: 2 },
		],
		amenities: ["Valet", "Wi-Fi", "Catering", "Parking"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/surat-diamond-1/1400/900", caption: "Exterior", type: "image" },
			{ url: "https://picsum.photos/seed/surat-diamond-2/1400/900", caption: "Conference floor", type: "image" },
		],
		pricing: { base_rate: 124000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Yash Gajera", email: "book@suratdiamondconvention.in", phone: "+91-9876543017" },
		is_active: true,
		rating_average: 4.3,
		rating_count: 87,
	},
	{
		name: "Orange City Event Arena",
		description: "Central Nagpur venue suitable for city-scale gatherings, seminars, and celebratory functions.",
		address: { street: "Civil Lines", city: "Nagpur", state: "Maharashtra", country: "India", zip: "440001" },
		location: { type: "Point", coordinates: [79.0882, 21.1458] },
		total_capacity: 920,
		halls: [
			{ hall_id: "OC-NGP-1", name: "Vidarbha Hall", capacity: 580, amenities: ["Stage", "Digital Audio"], hourly_rate: 7300, floor: 1 },
			{ hall_id: "OC-NGP-2", name: "Orange Suite", capacity: 340, amenities: ["Meeting Setup", "Projector"], hourly_rate: 5100, floor: 1 },
		],
		amenities: ["Parking", "Catering", "Power Backup", "Security"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/nagpur-orange-1/1400/900", caption: "Entry view", type: "image" },
			{ url: "https://picsum.photos/seed/nagpur-orange-2/1400/900", caption: "Hall interior", type: "image" },
		],
		pricing: { base_rate: 98000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Shubham Tiwari", email: "events@orangecityarena.in", phone: "+91-9876543018" },
		is_active: true,
		rating_average: 4.1,
		rating_count: 64,
	},
	{
		name: "Lakeview Convention Enclave",
		description: "Bhopal lake-facing venue balancing scenic aesthetics with enterprise-ready infrastructure.",
		address: { street: "VIP Road", city: "Bhopal", state: "Madhya Pradesh", country: "India", zip: "462002" },
		location: { type: "Point", coordinates: [77.4126, 23.2599] },
		total_capacity: 890,
		halls: [
			{ hall_id: "LV-BPL-1", name: "Upper Lake Hall", capacity: 560, amenities: ["Stage", "Audio Console"], hourly_rate: 7100, floor: 1 },
			{ hall_id: "LV-BPL-2", name: "Shyamla Suite", capacity: 330, amenities: ["Presentation Setup", "Wi-Fi"], hourly_rate: 5000, floor: 2 },
		],
		amenities: ["Lake View", "Parking", "Catering", "Backup Power"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/bhopal-lakeview-1/1400/900", caption: "Lakeside panorama", type: "image" },
			{ url: "https://picsum.photos/seed/bhopal-lakeview-2/1400/900", caption: "Convention setup", type: "image" },
		],
		pricing: { base_rate: 96000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Pooja Verma", email: "hello@lakeviewenclave.in", phone: "+91-9876543019" },
		is_active: true,
		rating_average: 4.2,
		rating_count: 71,
	},
	{
		name: "Vizag Seafront Convention Centre",
		description: "Large venue by the coast with dedicated expo floor and auditorium for conferences.",
		address: { street: "Beach Road", city: "Visakhapatnam", state: "Andhra Pradesh", country: "India", zip: "530002" },
		location: { type: "Point", coordinates: [83.3013, 17.6868] },
		total_capacity: 1320,
		halls: [
			{ hall_id: "VS-VZG-1", name: "Dolphin Hall", capacity: 840, amenities: ["Large Stage", "Projection Mapping"], hourly_rate: 10800, floor: 1 },
			{ hall_id: "VS-VZG-2", name: "Harbor Chamber", capacity: 480, amenities: ["Seminar Seating", "PA System"], hourly_rate: 7600, floor: 2 },
		],
		amenities: ["Sea View", "Valet", "Catering", "Fiber Internet"],
		media_gallery: [
			{ url: "https://picsum.photos/seed/vizag-seafront-1/1400/900", caption: "Seafront elevation", type: "image" },
			{ url: "https://picsum.photos/seed/vizag-seafront-2/1400/900", caption: "Main convention hall", type: "image" },
		],
		pricing: { base_rate: 167000, currency: "INR", pricing_model: "per_day" },
		contact: { name: "Harini Rao", email: "bookings@vizagseafront.in", phone: "+91-9876543020" },
		is_active: true,
		rating_average: 4.5,
		rating_count: 116,
	},
];

const venueUpsertOps = venues.map((venue) => ({
	updateOne: {
		filter: { name: venue.name, "address.city": venue.address.city },
		update: {
			$set: { ...venue, updatedAt: now },
			$setOnInsert: { createdAt: now },
		},
		upsert: true,
	},
}));

const venueSeedResult = db.venues.bulkWrite(venueUpsertOps, { ordered: false });

print("Venue/Vendor MongoDB indexes created successfully.");
print(`Venue seed completed: matched=${venueSeedResult.matchedCount}, upserted=${venueSeedResult.upsertedCount}, modified=${venueSeedResult.modifiedCount}`);
