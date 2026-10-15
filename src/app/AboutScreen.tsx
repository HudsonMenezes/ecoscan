import { strings } from '@/config/strings';
import { useScreen } from '@/shared/lib/screen';

const { about, privacy } = strings;

// Página "Sobre": o que é o EcoScan e o que acontece com a foto, a voz e os dados.
export function AboutScreen() {
  useScreen({
    speech: `${about.title}. ${about.intro} ${about.privacyTitle}. ${about.photo} ${privacy.voice} ${about.data}`,
  });

  return (
    <div className="about">
      <h1 className="about__title">{about.title}</h1>
      <p>{about.intro}</p>
      <section className="card about__section" aria-labelledby="about-privacy">
        <h2 id="about-privacy">{about.privacyTitle}</h2>
        <ul>
          <li>{about.photo}</li>
          <li>{about.camera}</li>
          <li>{privacy.voice}</li>
          <li>{about.data}</li>
        </ul>
      </section>
    </div>
  );
}
