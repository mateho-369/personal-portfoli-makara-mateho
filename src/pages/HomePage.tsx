import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, BookOpen, Camera, Coffee, Code2, Compass, Heart, Leaf, MapPin, Mountain, Music, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { Favorite, MediaItem, Profile } from '../types';
import LoadingState from '../components/LoadingState';
import { api } from '../lib/api';

const favoriteIcons: Record<string, typeof Leaf> = { leaf: Leaf, camera: Camera, coffee: Coffee, code: Code2, compass: Compass, mountain: Mountain, music: Music, book: BookOpen };
const reveal = { initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.18 }, transition: { duration: 0.7, ease: 'easeOut' as const } };

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    Promise.all([
      api.profile.get(),
      api.favorites.list(),
      api.media.list(),
    ]).then(([profileData, favoriteData, mediaData]) => {
      setProfile(profileData); setFavorites(favoriteData); setMedia(mediaData);
    }).catch((err) => setError(err.message || 'The page could not be loaded.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [loading, location.hash]);

  if (loading) return <LoadingState />;
  if (error || !profile) return <div className="page-shell py-28"><div className="error-card"><p>{error || 'Profile not found.'}</p><button onClick={() => window.location.reload()} className="btn-primary mt-5">Try again</button></div></div>;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="hero-glow" />
        <div className="page-shell relative flex min-h-[calc(100vh-76px)] flex-col justify-center py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85 }} className="max-w-4xl">
            <p className="eyebrow mb-6"><Sparkles size={13} /> A quiet corner of the internet</p>
            <h1 className="max-w-4xl font-serif text-[clamp(3.8rem,10vw,8.6rem)] leading-[0.88] tracking-[-0.065em] text-[#2B3328]">
              {profile.display_name.split(' ').map((word, index) => <span key={word} className={index === 1 ? 'text-[#6E7C52]' : ''}>{word}{' '}</span>)}
            </h1>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <p className="max-w-xl text-lg leading-relaxed text-[#536050] sm:text-xl">{profile.role_title}</p>
              <span className="hidden h-px w-12 bg-[#D9A441]/60 sm:block" />
              <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#687064]"><MapPin size={13} />{profile.location}</span>
            </div>
            <div className="mt-10 flex flex-wrap gap-3"><Link to="/gallery" className="btn-primary">View gallery <ArrowRight size={17} /></Link><Link to="/chat" className="btn-outline">Say hello <ArrowRight size={17} /></Link></div>
          </motion.div>
          <div className="absolute bottom-10 left-5 right-5 flex items-center gap-4 sm:left-8 sm:right-8">
            <span className="h-px flex-1 bg-gradient-to-r from-[#6E7C52] via-[#D9A441] to-[#5C7A89]" />
            <ArrowDown size={16} className="animate-gentle-bob text-[#6E7C52]" />
          </div>
        </div>
      </section>

      <section className="page-shell py-24 md:py-32">
        <motion.div {...reveal} className="grid items-center gap-12 lg:grid-cols-[1.05fr_.85fr] lg:gap-20">
          <div>
            <p className="eyebrow">01 · About me</p>
            <h2 className="section-title mt-5">Making room for<br /><em className="font-normal text-[#5C7A89]">wonder.</em></h2>
            <p className="mt-7 max-w-2xl text-lg leading-[1.85] text-[#536050]">{profile.bio}</p>
            <blockquote className="mt-8 border-l-2 border-[#D9A441] pl-5 font-serif text-xl italic leading-relaxed text-[#3E493A]">“{profile.quote}”</blockquote>
          </div>
          <div className="relative mx-auto max-w-md">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#D9A441]/25 via-transparent to-[#5C7A89]/25 blur-xl" />
            <img src={profile.avatar_url} alt={`${profile.display_name} outdoors`} className="relative aspect-[4/5] w-full rounded-[1.7rem] object-cover shadow-[0_24px_70px_rgba(43,51,40,.16)]" />
            <span className="absolute -bottom-4 -left-4 rounded-full border border-[#D9A441]/25 bg-[#F8F4E9] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#657060]">Here, now, grateful</span>
          </div>
        </motion.div>
      </section>

      <section id="favorites" className="scroll-mt-24 bg-[#F8F4E9]/70 py-24 md:py-32">
        <div className="page-shell">
          <motion.div {...reveal} className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="eyebrow">02 · Small joys</p><h2 className="section-title mt-5">Things I love</h2></div>
            <p className="max-w-sm text-sm leading-relaxed text-[#687064]">A collection of things that keep me curious, grounded, and moving gently through the world.</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((favorite, index) => {
              const Icon = favoriteIcons[favorite.icon] || Heart;
              return (
                <motion.article key={favorite.id} {...reveal} transition={{ duration: 0.55, delay: index * 0.05 }} className="favorite-card group">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#6E7C52]/10 text-[#6E7C52] transition-colors group-hover:bg-[#D9A441]/15 group-hover:text-[#A7751E]"><Icon size={20} strokeWidth={1.7} /></span>
                  <h3 className="mt-7 font-serif text-2xl">{favorite.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#687064]">{favorite.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-shell py-24 md:py-32">
        <motion.div {...reveal} className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="eyebrow">03 · Field journal</p><h2 className="section-title mt-5">From the gallery</h2></div>
          <Link to="/gallery" className="text-link">View full gallery <ArrowRight size={16} /></Link>
        </motion.div>
        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[230px] md:grid-cols-4">
          {media.slice(0, 5).map((item, index) => (
            <Link to="/gallery" key={item.id} className={`gallery-preview group ${index === 0 ? 'col-span-2 row-span-2' : index === 3 ? 'col-span-2' : ''}`}>
              <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B3328]/65 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
              <div className="absolute bottom-0 left-0 p-4 text-[#F8F4E9]"><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#F8F4E9]/75">{item.category}</span><p className="mt-1 font-serif text-lg">{item.title}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell pb-12">
        <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] bg-[#2B3328] px-6 py-16 text-center text-[#F8F4E9] sm:px-12 md:py-20">
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D9A441]/10 blur-3xl" />
          <p className="eyebrow relative !text-[#D9A441]">The door is open</p>
          <h2 className="relative mt-5 font-serif text-4xl tracking-tight sm:text-5xl">Let’s exchange a few kind words.</h2>
          <p className="relative mx-auto mt-5 max-w-xl text-[#D7D9CF]">No pitch, no pressure. Just a quiet conversation about ideas, images, or whatever is bringing you hope lately.</p>
          <Link to="/chat" className="btn-primary relative mt-8">Start a conversation <ArrowRight size={17} /></Link>
        </motion.div>
      </section>
    </>
  );
}
