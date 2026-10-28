// @ts-check
import { useState } from 'react';
import { SITE_NAME, SITE_PAGES } from './sitePages';
import { Button, Dialog, IconButton } from '../../components';
import { Icon } from '../../icons';
import './SiteMenu.scss';

const NEW_TAB = { target: '_blank', rel: 'noreferrer' };

function Page({ page }) {
  return page.sections.map((section, index) => (
    <section key={section.title ?? index} className="site-menu__section">
      {section.title && <h3>{section.title}</h3>}
      {section.text.map((line) => <p key={line}>{line}</p>)}
      {section.links?.map((link) => (
        <p key={link.href}>
          {/* Un lien mail ouvre la messagerie, pas un nouvel onglet */}
          <a href={link.href} {...(link.href.startsWith('mailto:') ? {} : NEW_TAB)}>{link.label}</a>
        </p>
      ))}
    </section>
  ));
}

/**
 * Menu ☰ en haut à droite : revoir l’intro, puis les pages
 * éditoriales. Une page s’ouvre dans la même fenêtre, sans quitter l’écran.
 */
export default function SiteMenu({ onReplay }) {
  const [open, setOpen] = useState(false);
  const [pageId, setPageId] = useState(null);
  const page = SITE_PAGES.find((item) => item.id === pageId);

  return (
    <div className="site-menu">
      <IconButton
        variant="tonal"
        icon="menu"
        label="Menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setPageId(null);
          setOpen(true);
        }}
      />
      <Dialog open={open} onClose={() => setOpen(false)} title="site-menu-title">
        <header className="site-menu__head">
          {page && <IconButton icon="chevronLeft" label="Retour au menu" onClick={() => setPageId(null)} />}
          <h2 id="site-menu-title">{page ? page.title : SITE_NAME}</h2>
          <IconButton icon="close" label="Fermer" className="site-menu__close" onClick={() => setOpen(false)} />
        </header>
        {page ? (
          <Page page={page} />
        ) : (
          <nav className="site-menu__list" aria-label="Pages">
            {onReplay && (
              <Button
                className="site-menu__item"
                onClick={() => {
                  setOpen(false);
                  onReplay();
                }}
              >
                <Icon name="play" size={18} />
                Revoir l’intro
              </Button>
            )}
            {SITE_PAGES.map((item) => (
              <Button key={item.id} className="site-menu__item" onClick={() => setPageId(item.id)}>
                {item.title}
              </Button>
            ))}
          </nav>
        )}
      </Dialog>
    </div>
  );
}
