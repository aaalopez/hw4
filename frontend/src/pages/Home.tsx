import { Link } from 'react-router-dom'
import BulldogMascot from '../components/BulldogMascot'
import CampusSkyline from '../components/CampusSkyline'
import './Home.css'

export default function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <div className="home__hero-copy">
          <p className="home__eyebrow">Yale Apparel, Reimagined</p>
          <h1>Gear that's proud to be Yale, made for everyday life.</h1>
          <p>
            Campus Customs is your spot for Yale apparel that actually fits how you live —
            whether that's a walk across Old Campus, a flight home for break, or just a lazy
            Sunday. Comfortable, well-made, and unmistakably Bulldog.
          </p>
          <div className="home__hero-actions">
            <Link to="/products" className="home__cta">
              Shop the Collection
            </Link>
            <Link to="/create-account" className="home__cta home__cta--ghost">
              Join the Bulldog Club
            </Link>
          </div>
        </div>
        <div className="home__hero-mascot">
          <BulldogMascot className="home__mascot-svg" />
          <span className="home__mascot-caption">Meet Blue, our resident model</span>
        </div>
      </section>

      <section className="home__campus">
        <CampusSkyline className="home__campus-svg" />
        <div className="home__campus-copy">
          <h2>Made for New Haven, worn everywhere.</h2>
          <p>
            From Harkness Tower to the Farmington Canal, Campus Customs gear is built for
            life around Yale's campus — and anywhere Bulldog pride travels with you.
          </p>
        </div>
      </section>

      <section className="home__highlights">
        <div className="home__highlight">
          <h3>Built for Every Yalie</h3>
          <p>
            Students, alumni, families, and anyone who bleeds a little blue — there's
            something here for you. Residential college crewnecks, varsity tees, and
            everyday layers that work for campus and beyond.
          </p>
        </div>
        <div className="home__highlight">
          <h3>Easy to Love, Easy to Wear</h3>
          <p>
            We keep things simple: solid materials, classic cuts, and designs that hold up
            long after the first wash. No gimmicks, just gear you'll actually reach for.
          </p>
        </div>
        <div className="home__highlight">
          <h3>Shop in Minutes</h3>
          <p>
            Browse by style, check sizes and stock in real time, and check out without the
            back-and-forth. If you've got questions, our chat assistant in the corner is
            ready to help.
          </p>
        </div>
      </section>
    </div>
  )
}
