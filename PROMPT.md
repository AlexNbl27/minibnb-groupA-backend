# Plan d'implémentation Backend - MiniBnB

## Stack technique

- **Framework** : Express.js avec TypeScript
- **BDD** : PostgreSQL via Supabase
- **Auth** : Supabase Auth (JWT)
- **Cache** : Redis
- **Validation** : Zod
- **ORM** : Supabase Client (pas de Prisma/TypeORM car RLS)
- **Tests** : Non requis pour ce projet

---

## Architecture du projet

```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.ts          # Client Supabase
│   │   ├── redis.ts             # Client Redis
│   │   └── env.ts               # Variables d'environnement
│   ├── middlewares/
│   │   ├── auth.middleware.ts   # Vérification JWT Supabase
│   │   ├── error.middleware.ts  # Gestion d'erreurs globale
│   │   ├── cache.middleware.ts  # Middleware cache Redis
│   │   └── validation.middleware.ts # Validation Zod
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── listing.types.ts
│   │   ├── booking.types.ts
│   │   └── message.types.ts
│   ├── validators/
│   │   ├── user.validator.ts
│   │   ├── listing.validator.ts
│   │   ├── booking.validator.ts
│   │   └── message.validator.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── listing.service.ts
│   │   ├── booking.service.ts
│   │   ├── message.service.ts
│   │   └── cache.service.ts
│   ├── routes/
│   │   ├── v1/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── profile.routes.ts
│   │   │   ├── listing.routes.ts
│   │   │   ├── booking.routes.ts
│   │   │   ├── message.routes.ts
│   │   │   └── cohost.routes.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── errors.ts            # Classes d'erreurs custom
│   │   ├── response.ts          # Format de réponse standard
│   │   └── dates.ts             # Helpers pour dates
│   └── app.ts                   # Application Express
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 1. Configuration initiale

### 1.1 Installation des dépendances

```json
// package.json
{
    "name": "minibnb-backend",
    "version": "1.0.0",
    "scripts": {
        "dev": "tsx watch src/app.ts",
        "build": "tsc",
        "start": "node dist/app.js"
    },
    "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "helmet": "^7.1.0",
        "dotenv": "^16.4.1",
        "@supabase/supabase-js": "^2.39.0",
        "redis": "^4.6.12",
        "zod": "^3.22.4"
    },
    "devDependencies": {
        "@types/express": "^4.17.21",
        "@types/cors": "^2.8.17",
        "@types/node": "^20.11.5",
        "tsx": "^4.7.0",
        "typescript": "^5.3.3"
    }
}
```

### 1.2 Configuration TypeScript

```json
// tsconfig.json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "commonjs",
        "lib": ["ES2022"],
        "outDir": "./dist",
        "rootDir": "./src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "moduleResolution": "node"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules"]
}
```

### 1.3 Variables d'environnement

```bash
# .env.example
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## 2. Configuration Supabase et Redis

### 2.1 Client Supabase

```typescript
// src/config/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
);

// Client avec service role pour bypass RLS (admin operations)
export const supabaseAdmin = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
);

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                    phone: string | null;
                    avatar_url: string | null;
                    bio: string | null;
                    is_host: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                    phone?: string;
                    avatar_url?: string;
                    bio?: string;
                    is_host?: boolean;
                };
                Update: {
                    first_name?: string;
                    last_name?: string;
                    phone?: string;
                    avatar_url?: string;
                    bio?: string;
                    is_host?: boolean;
                };
            };
            // ... autres tables
        };
    };
};
```

### 2.2 Client Redis

```typescript
// src/config/redis.ts
import { createClient } from "redis";
import { env } from "./env";

const redisClient = createClient({
    socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
    },
    password: env.REDIS_PASSWORD || undefined,
});

redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
});

redisClient.on("connect", () => {
    console.log("✅ Redis connected");
});

export const connectRedis = async () => {
    await redisClient.connect();
};

export default redisClient;
```

### 2.3 Variables d'environnement

```typescript
// src/config/env.ts
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default(
        "development",
    ),
    PORT: z.string().default("3001"),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.string().default("6379"),
    REDIS_PASSWORD: z.string().optional(),
    FRONTEND_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

---

## 3. Middlewares

### 3.1 Authentification

```typescript
// src/middlewares/auth.middleware.ts
import { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase";
import { UnauthorizedError } from "../utils/errors";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError(
                "Missing or invalid authorization header",
            );
        }

        const token = authHeader.split(" ")[1];

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            throw new UnauthorizedError("Invalid or expired token");
        }

        req.user = {
            id: data.user.id,
            email: data.user.email!,
        };

        next();
    } catch (error) {
        next(error);
    }
};
```

### 3.2 Gestion d'erreurs

```typescript
// src/middlewares/error.middleware.ts
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors,
        });
    }

    // Erreur Zod
    if (error.name === "ZodError") {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: (error as any).errors,
        });
    }

    console.error("Unhandled error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
```

### 3.3 Cache Redis

```typescript
// src/middlewares/cache.middleware.ts
import { NextFunction, Request, Response } from "express";
import redisClient from "../config/redis";

export const cacheMiddleware = (ttl: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const key = `cache:${req.originalUrl}`;

        try {
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }

            // Override res.json pour cacher la réponse
            const originalJson = res.json.bind(res);
            res.json = (body: any) => {
                redisClient.setEx(key, ttl, JSON.stringify(body));
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error("Cache error:", error);
            next();
        }
    };
};
```

### 3.4 Validation

```typescript
// src/middlewares/validation.middleware.ts
import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

export const validate = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            next(error);
        }
    };
};
```

---

## 4. Types et Validators

### 4.1 Types

```typescript
// src/types/user.types.ts
export interface Profile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    avatar_url?: string;
    bio?: string;
    is_host: boolean;
    created_at: string;
    updated_at: string;
}

export interface CoHost {
    id: number;
    listing_id: number;
    host_id: string;
    co_host_id: string;
    can_edit_listing: boolean;
    can_access_messages: boolean;
    can_respond_messages: boolean;
    created_at: string;
}

// src/types/listing.types.ts
export interface Listing {
    id: number;
    host_id: string;
    name: string;
    description?: string;
    picture_url: string;
    price: number;
    address: string;
    city: string;
    postal_code?: string;
    neighbourhood_group_cleansed?: string;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    max_guests: number;
    property_type: string;
    rules?: string;
    amenities: string[];
    review_scores_value?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// src/types/booking.types.ts
export interface Booking {
    id: number;
    listing_id: number;
    guest_id: string;
    check_in: string; // ISO date
    check_out: string;
    total_price: number;
    guest_count: number;
    created_at: string;
    updated_at: string;
}

// src/types/message.types.ts
export interface Message {
    id: number;
    conversation_id: number;
    sender_id: string;
    content: string;
    created_at: string;
}
```

### 4.2 Validators

```typescript
// src/validators/listing.validator.ts
import { z } from "zod";

export const createListingSchema = z.object({
    body: z.object({
        name: z.string().min(10).max(255),
        description: z.string().optional(),
        picture_url: z.string().url(),
        price: z.number().int().positive(),
        address: z.string().min(5),
        city: z.string().min(2),
        postal_code: z.string().optional(),
        neighbourhood_group_cleansed: z.string().optional(),
        bedrooms: z.number().int().positive().default(1),
        beds: z.number().int().positive().default(1),
        bathrooms: z.number().positive().default(1.0),
        max_guests: z.number().int().positive().default(2),
        property_type: z.string().default("Rental unit"),
        rules: z.string().optional(),
        amenities: z.array(z.string()).default([]),
    }),
});

export const updateListingSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().min(10).max(255).optional(),
        description: z.string().optional(),
        picture_url: z.string().url().optional(),
        price: z.number().int().positive().optional(),
        address: z.string().min(5).optional(),
        city: z.string().min(2).optional(),
        is_active: z.boolean().optional(),
    }),
});

// src/validators/booking.validator.ts
import { z } from "zod";

export const createBookingSchema = z.object({
    body: z.object({
        listing_id: z.number().int().positive(),
        check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        guest_count: z.number().int().positive().default(1),
    }).refine((data) => new Date(data.check_out) > new Date(data.check_in), {
        message: "check_out must be after check_in",
        path: ["check_out"],
    }),
});
```

---

## 5. Services

### 5.1 Listing Service

```typescript
// src/services/listing.service.ts
import { supabase, supabaseAdmin } from "../config/supabase";
import { Listing } from "../types/listing.types";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export class ListingService {
    // Créer une annonce (hôte uniquement)
    async create(userId: string, data: Partial<Listing>): Promise<Listing> {
        // Vérifier que l'utilisateur est hôte
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_host")
            .eq("id", userId)
            .single();

        if (!profile?.is_host) {
            throw new ForbiddenError("Only hosts can create listings");
        }

        const { data: listing, error } = await supabase
            .from("listings")
            .insert({ ...data, host_id: userId })
            .select()
            .single();

        if (error) throw error;
        return listing;
    }

    // Récupérer toutes les annonces (avec cache)
    async getAll(filters?: {
        city?: string;
        min_price?: number;
        max_price?: number;
        guests?: number;
    }): Promise<Listing[]> {
        let query = supabase
            .from("listings")
            .select("*")
            .eq("is_active", true);

        if (filters?.city) {
            query = query.ilike("city", `%${filters.city}%`);
        }
        if (filters?.min_price) {
            query = query.gte("price", filters.min_price);
        }
        if (filters?.max_price) {
            query = query.lte("price", filters.max_price);
        }
        if (filters?.guests) {
            query = query.gte("max_guests", filters.guests);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // Récupérer une annonce par ID
    async getById(id: number): Promise<Listing> {
        const { data, error } = await supabase
            .from("listings")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            throw new NotFoundError("Listing not found");
        }
        return data;
    }

    // Mettre à jour une annonce
    async update(
        id: number,
        userId: string,
        data: Partial<Listing>,
    ): Promise<Listing> {
        // Vérifier permissions (hôte ou co-hôte avec can_edit_listing)
        const canEdit = await this.checkEditPermission(id, userId);
        if (!canEdit) {
            throw new ForbiddenError(
                "You do not have permission to edit this listing",
            );
        }

        const { data: listing, error } = await supabase
            .from("listings")
            .update(data)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return listing;
    }

    // Supprimer une annonce (hôte uniquement)
    async delete(id: number, userId: string): Promise<void> {
        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", id)
            .single();

        if (listing?.host_id !== userId) {
            throw new ForbiddenError("Only the host can delete the listing");
        }

        const { error } = await supabase
            .from("listings")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }

    // Vérifier permission d'édition
    private async checkEditPermission(
        listingId: number,
        userId: string,
    ): Promise<boolean> {
        // Vérifier si hôte principal
        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", listingId)
            .single();

        if (listing?.host_id === userId) return true;

        // Vérifier si co-hôte avec permission
        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("can_edit_listing")
            .eq("listing_id", listingId)
            .eq("co_host_id", userId)
            .single();

        return coHost?.can_edit_listing || false;
    }
}
```

### 5.2 Booking Service

```typescript
// src/services/booking.service.ts
import { supabase } from "../config/supabase";
import { Booking } from "../types/booking.types";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class BookingService {
    // Créer une réservation (avec validation chevauchement)
    async create(
        userId: string,
        data: {
            listing_id: number;
            check_in: string;
            check_out: string;
            guest_count: number;
        },
    ): Promise<Booking> {
        // Vérifier que le listing existe et est actif
        const { data: listing } = await supabase
            .from("listings")
            .select("id, price, max_guests, is_active")
            .eq("id", data.listing_id)
            .single();

        if (!listing || !listing.is_active) {
            throw new NotFoundError("Listing not found or inactive");
        }

        if (data.guest_count > listing.max_guests) {
            throw new BadRequestError(
                `Maximum ${listing.max_guests} guests allowed`,
            );
        }

        // Vérifier disponibilité (pas de chevauchement)
        const { data: conflictingBookings } = await supabase
            .from("bookings")
            .select("id")
            .eq("listing_id", data.listing_id)
            .or(
                `and(check_in.lte.${data.check_out},check_out.gte.${data.check_in})`,
            );

        if (conflictingBookings && conflictingBookings.length > 0) {
            throw new BadRequestError(
                "Listing is not available for these dates",
            );
        }

        // Calculer le prix total
        const days = Math.ceil(
            (new Date(data.check_out).getTime() -
                new Date(data.check_in).getTime()) /
                (1000 * 60 * 60 * 24),
        );
        const total_price = days * listing.price;

        const { data: booking, error } = await supabase
            .from("bookings")
            .insert({
                ...data,
                guest_id: userId,
                total_price,
            })
            .select()
            .single();

        if (error) throw error;
        return booking;
    }

    // Récupérer les réservations d'un utilisateur
    async getByUser(userId: string): Promise<Booking[]> {
        const { data, error } = await supabase
            .from("bookings")
            .select("*, listing:listings(*)")
            .eq("guest_id", userId)
            .order("check_in", { ascending: false });

        if (error) throw error;
        return data;
    }

    // Récupérer les réservations d'un listing (hôte/co-hôte)
    async getByListing(listingId: number, userId: string): Promise<Booking[]> {
        // Vérifier permission (hôte ou co-hôte)
        const canView = await this.checkViewPermission(listingId, userId);
        if (!canView) {
            throw new ForbiddenError(
                "You do not have permission to view bookings",
            );
        }

        const { data, error } = await supabase
            .from("bookings")
            .select("*, guest:profiles(first_name, last_name, avatar_url)")
            .eq("listing_id", listingId)
            .order("check_in", { ascending: false });

        if (error) throw error;
        return data;
    }

    private async checkViewPermission(
        listingId: number,
        userId: string,
    ): Promise<boolean> {
        const { data: listing } = await supabase
            .from("listings")
            .select("host_id")
            .eq("id", listingId)
            .single();

        if (listing?.host_id === userId) return true;

        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("id")
            .eq("listing_id", listingId)
            .eq("co_host_id", userId)
            .single();

        return !!coHost;
    }
}
```

### 5.3 Message Service

```typescript
// src/services/message.service.ts
import { supabase } from "../config/supabase";
import { Message } from "../types/message.types";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export class MessageService {
    // Envoyer un message
    async send(
        userId: string,
        conversationId: number,
        content: string,
    ): Promise<Message> {
        // Vérifier permission (guest, hôte ou co-hôte avec can_respond_messages)
        const canSend = await this.checkSendPermission(conversationId, userId);
        if (!canSend) {
            throw new ForbiddenError(
                "You cannot send messages in this conversation",
            );
        }

        const { data: message, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                content,
            })
            .select()
            .single();

        if (error) throw error;
        return message;
    }

    // Récupérer les messages d'une conversation
    async getByConversation(
        conversationId: number,
        userId: string,
    ): Promise<Message[]> {
        // Vérifier permission
        const canView = await this.checkViewPermission(conversationId, userId);
        if (!canView) {
            throw new ForbiddenError("You cannot view this conversation");
        }

        const { data, error } = await supabase
            .from("messages")
            .select("*, sender:profiles(first_name, last_name, avatar_url)")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return data;
    }

    // Vérifier permission d'envoi
    private async checkSendPermission(
        conversationId: number,
        userId: string,
    ): Promise<boolean> {
        const { data: conversation } = await supabase
            .from("conversations")
            .select("guest_id, host_id, listing_id")
            .eq("id", conversationId)
            .single();

        if (!conversation) return false;

        // Guest ou hôte
        if (
            conversation.guest_id === userId ||
            conversation.host_id === userId
        ) {
            return true;
        }

        // Co-hôte avec can_respond_messages
        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("can_respond_messages")
            .eq("listing_id", conversation.listing_id)
            .eq("co_host_id", userId)
            .single();

        return coHost?.can_respond_messages || false;
    }

    // Vérifier permission de lecture
    private async checkViewPermission(
        conversationId: number,
        userId: string,
    ): Promise<boolean> {
        const { data: conversation } = await supabase
            .from("conversations")
            .select("guest_id, host_id, listing_id")
            .eq("id", conversationId)
            .single();

        if (!conversation) return false;

        if (
            conversation.guest_id === userId ||
            conversation.host_id === userId
        ) {
            return true;
        }

        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("can_access_messages")
            .eq("listing_id", conversation.listing_id)
            .eq("co_host_id", userId)
            .single();

        return coHost?.can_access_messages || false;
    }
}
```

### 5.4 Cache Service

```typescript
// src/services/cache.service.ts
import redisClient from "../config/redis";

export class CacheService {
    async get<T>(key: string): Promise<T | null> {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttl: number): Promise<void> {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
    }

    async del(key: string): Promise<void> {
        await redisClient.del(key);
    }

    async invalidatePattern(pattern: string): Promise<void> {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    }

    // Invalidations spécifiques
    async invalidateListingCache(listingId: number): Promise<void> {
        await this.invalidatePattern(`cache:/api/v1/listings/${listingId}*`);
        await this.invalidatePattern("cache:/api/v1/listings?*");
    }

    async invalidateBookingCache(listingId: number): Promise<void> {
        await this.invalidatePattern(`cache:listing:${listingId}:availability`);
    }
}
```

---

## 6. Routes

### 6.1 Structure des routes

```typescript
// src/routes/index.ts
import express from "express";
import v1Routes from "./v1";

const router = express.Router();

router.use("/v1", v1Routes);

export default router;

// src/routes/v1/index.ts
import express from "express";
import authRoutes from "./auth.routes";
import profileRoutes from "./profile.routes";
import listingRoutes from "./listing.routes";
import bookingRoutes from "./booking.routes";
import messageRoutes from "./message.routes";
import cohostRoutes from "./cohost.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/profiles", profileRoutes);
router.use("/listings", listingRoutes);
router.use("/bookings", bookingRoutes);
router.use("/messages", messageRoutes);
router.use("/cohosts", cohostRoutes);

export default router;
```

### 6.2 Routes Auth

```typescript
// src/routes/v1/auth.routes.ts
import express from "express";
import { supabase } from "../../config/supabase";
import { validate } from "../../middlewares/validation.middleware";
import { z } from "zod";

const router = express.Router();

const signupSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        first_name: z.string().min(2),
        last_name: z.string().min(2),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

// POST /api/v1/auth/signup
router.post("/signup", validate(signupSchema), async (req, res, next) => {
    try {
        const { email, password, first_name, last_name } = req.body;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { first_name, last_name },
            },
        });

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: {
                user: data.user,
                session: data.session,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/login
router.post("/login", validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        res.json({
            success: true,
            data: {
                user: data.user,
                session: data.session,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/logout
router.post("/logout", async (req, res, next) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;
```

### 6.3 Routes Listing

```typescript
// src/routes/v1/listing.routes.ts
import express from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { cacheMiddleware } from "../../middlewares/cache.middleware";
import { ListingService } from "../../services/listing.service";
import { CacheService } from "../../services/cache.service";
import {
    createListingSchema,
    updateListingSchema,
} from "../../validators/listing.validator";

const router = express.Router();
const listingService = new ListingService();
const cacheService = new CacheService();

// GET /api/v1/listings (avec cache 5 min)
router.get("/", cacheMiddleware(300), async (req, res, next) => {
    try {
        const filters = {
            city: req.query.city as string,
            min_price: req.query.min_price
                ? Number(req.query.min_price)
                : undefined,
            max_price: req.query.max_price
                ? Number(req.query.max_price)
                : undefined,
            guests: req.query.guests ? Number(req.query.guests) : undefined,
        };

        const listings = await listingService.getAll(filters);

        res.json({ success: true, data: listings });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/listings/:id (avec cache 1h)
router.get("/:id", cacheMiddleware(3600), async (req, res, next) => {
    try {
        const listing = await listingService.getById(Number(req.params.id));
        res.json({ success: true, data: listing });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/listings (protégé)
router.post(
    "/",
    authenticate,
    validate(createListingSchema),
    async (req, res, next) => {
        try {
            const listing = await listingService.create(req.user!.id, req.body);

            // Invalider cache
            await cacheService.invalidatePattern("cache:/api/v1/listings?*");

            res.status(201).json({ success: true, data: listing });
        } catch (error) {
            next(error);
        }
    },
);

// PATCH /api/v1/listings/:id (protégé)
router.patch(
    "/:id",
    authenticate,
    validate(updateListingSchema),
    async (req, res, next) => {
        try {
            const listing = await listingService.update(
                Number(req.params.id),
                req.user!.id,
                req.body,
            );

            // Invalider cache
            await cacheService.invalidateListingCache(Number(req.params.id));

            res.json({ success: true, data: listing });
        } catch (error) {
            next(error);
        }
    },
);

// DELETE /api/v1/listings/:id (protégé)
router.delete("/:id", authenticate, async (req, res, next) => {
    try {
        await listingService.delete(Number(req.params.id), req.user!.id);

        // Invalider cache
        await cacheService.invalidateListingCache(Number(req.params.id));

        res.json({ success: true, message: "Listing deleted" });
    } catch (error) {
        next(error);
    }
});

export default router;
```

---

## 7. Application Express

```typescript
// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gestion d'erreurs
app.use(errorHandler);

// Démarrage
const start = async () => {
    try {
        await connectRedis();

        app.listen(env.PORT, () => {
            console.log(`🚀 Server running on http://localhost:${env.PORT}`);
            console.log(`📝 Environment: ${env.NODE_ENV}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

start();
```

---

## 8. Gestion des erreurs

```typescript
// src/utils/errors.ts
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public errors?: any[],
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, errors?: any[]) {
        super(400, message, errors);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(401, message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(403, message);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(404, message);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, message);
    }
}
```

---

## 9. Plan de développement (2 backend devs)

### Phase 1 : Configuration (1 jour)

**Dev 1** :

- Setup projet Express + TypeScript
- Configuration Supabase
- Middlewares (auth, error, validation)

**Dev 2** :

- Configuration Redis
- Types et validators
- Utilitaires (errors, response)

### Phase 2 : Auth & Profiles (1 jour)

**Dev 1** :

- Routes auth (signup, login, logout)
- Gestion profils

**Dev 2** :

- Service cache
- Tests Postman/Insomnia

### Phase 3 : Listings (2 jours)

**Dev 1** :

- Service listings (CRUD)
- Routes listings + validation

**Dev 2** :

- Gestion co-hôtes (routes + service)
- Permissions avancées

### Phase 4 : Bookings (2 jours)

**Dev 1** :

- Service bookings
- Validation disponibilités

**Dev 2** :

- Routes bookings
- Cache + invalidation

### Phase 5 : Messagerie (2 jours)

**Dev 1** :

- Service messages
- Routes messages

**Dev 2** :

- Tests Realtime Supabase
- Permissions messagerie

### Phase 6 : Finalisations (1 jour)

**Dev 1 + Dev 2** :

- Documentation API
- Tests E2E
- Optimisations

---

## 10. Documentation API

### Format standard de réponse

**Success** :

```json
{
  "success": true,
  "data": { ... }
}
```

**Error** :

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // optional validation errors
}
```

### Codes de statut HTTP

| Code | Usage                             |
| ---- | --------------------------------- |
| 200  | Succès (GET, PATCH)               |
| 201  | Ressource créée (POST)            |
| 204  | Succès sans contenu (DELETE)      |
| 400  | Validation error                  |
| 401  | Non authentifié                   |
| 403  | Non autorisé                      |
| 404  | Ressource introuvable             |
| 409  | Conflit (ex: dates indisponibles) |
| 500  | Erreur serveur                    |

---

## 11. Stratégie de cache

### Clés Redis

```typescript
// Listings
"cache:/api/v1/listings?city=Bordeaux&..."; // 5 min
"cache:/api/v1/listings/:id"; // 1h

// Disponibilités
"listing:{id}:availability"; // 1h

// Profils
"profile:{id}"; // 30 min
```

### Invalidation

- **Création listing** → invalider `cache:/api/v1/listings?*`
- **Modification listing** → invalider `cache:/api/v1/listings/:id*`
- **Création booking** → invalider `listing:{id}:availability`

---

## Résumé des endpoints

| Méthode | Endpoint                           | Auth | Description           |
| ------- | ---------------------------------- | ---- | --------------------- |
| POST    | /api/v1/auth/signup                | ❌   | Inscription           |
| POST    | /api/v1/auth/login                 | ❌   | Connexion             |
| POST    | /api/v1/auth/logout                | ❌   | Déconnexion           |
| GET     | /api/v1/profiles/me                | ✅   | Mon profil            |
| PATCH   | /api/v1/profiles/me                | ✅   | Modifier profil       |
| GET     | /api/v1/listings                   | ❌   | Liste annonces        |
| GET     | /api/v1/listings/:id               | ❌   | Détails annonce       |
| POST    | /api/v1/listings                   | ✅   | Créer annonce         |
| PATCH   | /api/v1/listings/:id               | ✅   | Modifier annonce      |
| DELETE  | /api/v1/listings/:id               | ✅   | Supprimer annonce     |
| GET     | /api/v1/listings/:id/bookings      | ✅   | Réservations annonce  |
| POST    | /api/v1/bookings                   | ✅   | Créer réservation     |
| GET     | /api/v1/bookings/me                | ✅   | Mes réservations      |
| GET     | /api/v1/conversations/:id          | ✅   | Messages conversation |
| POST    | /api/v1/conversations/:id/messages | ✅   | Envoyer message       |
| POST    | /api/v1/listings/:id/cohosts       | ✅   | Ajouter co-hôte       |
| DELETE  | /api/v1/cohosts/:id                | ✅   | Retirer co-hôte       |

---

## Checklist finale

- [x] Configuration Express + TypeScript
- [x] Supabase Auth intégré
- [x] Row Level Security (RLS) pour sécurité de base
- [x] Validation avec Zod
- [x] Cache Redis avec invalidation
- [x] Gestion d'erreurs centralisée
- [x] Versioning API (v1)
- [x] Documentation complète
- [x] Permissions avancées en Express (co-hôtes)
- [x] Validation disponibilités (pas de chevauchement)
- [x] Structure prête pour Realtime (messages)
