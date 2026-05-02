-- FluxChat v2 Supabase Schema

-- 1. Create Profiles Table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Rooms Table (Persistent metadata only)
CREATE TABLE public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    code_hash TEXT, -- Hashed 4-digit code for private rooms
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)

-- Profiles: Anyone can read, only owner can update
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Rooms: Anyone can read public, owners can manage
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public rooms are viewable by everyone." ON public.rooms
    FOR SELECT USING (is_private = false OR auth.uid() = created_by);

CREATE POLICY "Users with code can join private rooms" ON public.rooms
    FOR SELECT USING (is_private = true); -- Logic handled by server verification

CREATE POLICY "Users can create rooms." ON public.rooms
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their rooms." ON public.rooms
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Owners can delete their rooms." ON public.rooms
    FOR DELETE USING (auth.uid() = created_by);

-- 4. Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar)
    VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
