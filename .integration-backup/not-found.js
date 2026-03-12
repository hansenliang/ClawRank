import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow">404</div>
        <h1 className="title">That agent card doesn’t exist.</h1>
        <p className="subtitle">Either the slug is wrong or the leaderboard data changed underneath it.</p>
        <Link href="/" className="cta">Back home</Link>
      </section>
    </main>
  );
}
