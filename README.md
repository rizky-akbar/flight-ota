# NileNusantara - Indonesia ⇄ Egypt Flight OTA (Galileo Travelport 1G & WhatsApp Admin)

A specialized Online Travel Agency (OTA) web platform connecting **Indonesia** (Jakarta, Surabaya, Bali, Medan, Makassar) and **Egypt** (Cairo, Alexandria, Sharm El Sheikh, Hurghada, Luxor, Aswan).

The application features:
1. **Galileo (Travelport Provider 1G) Universal API Integration**:
   - Supports live SOAP/XML `AirLowFareSearchReq` querying Galileo GDS with TargetBranch/PCC and credentials.
   - High-fidelity fallback / simulation mode with authentic flight schedules (Saudia, EgyptAir, Emirates, Qatar Airways, Oman Air, Etihad) and realistic pricing in IDR & USD.
2. **Passenger Manifest & Booking Inquiry Flow**:
   - Captures Contact Person info (Full name, active WhatsApp phone, email).
   - Passenger details per ticket (Title, Full Name matching Passport, Passport Number, Expiry, Nationality, Date of Birth).
   - Route-specific add-ons: Halal meal selection, extra baggage, Al-Azhar student visa support, and Umrah transit packages.
3. **Instant WhatsApp Admin Dispatch**:
   - Automatically formats a detailed booking manifest into a WhatsApp text message.
   - Direct click-to-chat button (`https://wa.me/{ADMIN_PHONE}?text=...`) for mobile and desktop WhatsApp.
   - On-screen QR code for mobile scanning.
   - Copy-to-clipboard button.
4. **Admin Reservations Dashboard (`/admin`)**:
   - Inquiries management dashboard with status tracking (`Pending`, `Contacted`, `Confirmed`, `Ticketed`, `Cancelled`).
   - One-click direct WhatsApp follow-up button to message the customer.

---

## Getting Started

### 1. Environment Configuration

Create or edit `.env.local`:

```env
# WhatsApp Admin Phone Number (International format without '+' or spaces, e.g. 6281234567890)
NEXT_PUBLIC_WHATSAPP_ADMIN=6281234567890

# Travelport Galileo Universal API (UAPI) Credentials
TRAVELPORT_ENDPOINT=https://americas.universal-api.pp.travelport.com/B2BGateway/connect/UAPI/AirService
TRAVELPORT_TARGET_BRANCH=P123456
TRAVELPORT_USERNAME=Universal API/uAPI12345678
TRAVELPORT_PASSWORD=YourSecretPasswordHere
TRAVELPORT_USE_MOCK=false
```

> **Note**: If `TRAVELPORT_USERNAME` or `TRAVELPORT_PASSWORD` are not provided, or `TRAVELPORT_USE_MOCK=true`, the platform seamlessly runs in high-fidelity sandbox mode with accurate real-world flight routes between Indonesia and Egypt.

### 2. Run the Application

```bash
# Development mode
npm run dev

# Production build & start
npm run build
npm run start -- -p 3007
```

Open your browser at:
- **Flight OTA Homepage**: [http://localhost:3007](http://localhost:3007)
- **Admin Inquiries Dashboard**: [http://localhost:3007/admin](http://localhost:3007/admin)

---

## API Endpoints

### 1. Flight Search (`GET /api/flights/search`)
Query params:
- `from`: Origin IATA code (e.g. `CGK`, `SUB`, `DPS`, `CAI`, `HBE`)
- `to`: Destination IATA code (e.g. `CAI`, `HBE`, `CGK`, `DPS`)
- `departureDate`: `YYYY-MM-DD`
- `returnDate`: `YYYY-MM-DD` (optional, for round-trip)
- `tripType`: `one-way` or `round-trip`
- `adults`, `children`, `infants`: passenger counts
- `cabinClass`: `Economy`, `PremiumEconomy`, `Business`

### 2. Booking Submission (`POST /api/bookings`)
Payload includes `flightOffer`, `contact`, `passengers`, `specialRequests`. Returns `bookingId`, `whatsappUrl`, and formatted `whatsappMessage`.

### 3. Admin Inquiries (`GET /api/admin/inquiries` & `PATCH /api/admin/inquiries`)
Fetches all booking inquiries and allows updating inquiry status.

---

## File Structure

```
src/
├── app/
│   ├── admin/page.tsx               # Admin Inquiries Dashboard
│   ├── api/
│   │   ├── admin/inquiries/route.ts # Admin inquiry API
│   │   ├── bookings/route.ts        # Booking submission & WhatsApp dispatch
│   │   └── flights/search/route.ts  # Galileo Travelport flight search API
│   ├── globals.css                  # Tailwind styles
│   ├── layout.tsx                   # Layout with metadata
│   └── page.tsx                     # Main Flight OTA booking portal
├── components/
│   ├── BookingModal.tsx             # Passenger form & WhatsApp Admin dispatch modal
│   ├── FlightCard.tsx               # Flight results card
│   ├── FlightDetailModal.tsx        # Segment breakdown & baggage modal
│   ├── FlightSearchForm.tsx         # Indonesia ⇄ Egypt specialized search form
│   ├── Footer.tsx                   # OTA footer
│   └── Navbar.tsx                   # Navbar with currency & admin links
├── lib/
│   ├── storage.ts                   # Persistent inquiries store
│   ├── whatsapp.ts                  # WhatsApp message & wa.me generator
│   └── travelport/
│       ├── galileoClient.ts         # Travelport Galileo 1G SOAP/XML Client
│       ├── mockData.ts              # Real-world flight schedules & fares
│       └── types.ts                 # TypeScript schemas
```
