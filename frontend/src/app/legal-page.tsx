import { PageShell } from '@/components/layout/page-layout';
import SurfacePanel from '@/components/ui/surface-panel';
import type { Locale } from '@/locales/translations';

type LegalPageKind = 'privacy' | 'terms';

type LegalSection = {
  title: string;
  body: string;
};

type LegalPageContent = {
  description: string;
  label: string;
  sections: LegalSection[];
  title: string;
};

const legalContent: Record<LegalPageKind, Record<Locale, LegalPageContent>> = {
  terms: {
    uk: {
      label: 'Правова інформація',
      title: 'Умови використання',
      description:
        'Основні правила користування Bloomify, оформлення замовлень і роботи з оплатою.',
      sections: [
        {
          title: 'Призначення сервісу',
          body: 'Bloomify допомагає переглядати каталог букетів, додавати товари до кошика, оформлювати доставку та оплачувати замовлення через підключеного платіжного провайдера.',
        },
        {
          title: 'Замовлення та оплата',
          body: 'Підсумкова вартість замовлення розраховується на сервері. Дані карток не зберігаються в Bloomify, а платежі обробляються через LiqPay або інший налаштований платіжний сервіс.',
        },
        {
          title: 'Доставка',
          body: 'Доставка виконується за адресою, яку клієнт вказує під час оформлення. Якщо потрібне уточнення деталей, команда Bloomify може звʼязатися за вказаним телефоном або email.',
        },
        {
          title: 'Обмеження',
          body: 'Не використовуйте сайт для шахрайських дій, спроб доступу до чужих даних, атак на сервіс або передачі некоректних контактних даних.',
        },
      ],
    },
    en: {
      label: 'Legal information',
      title: 'Terms of use',
      description:
        'Core rules for using Bloomify, placing orders, and working with payments.',
      sections: [
        {
          title: 'Service purpose',
          body: 'Bloomify lets customers browse bouquets, add products to the cart, arrange delivery, and pay through a connected payment provider.',
        },
        {
          title: 'Orders and payments',
          body: 'The final order total is calculated on the server. Bloomify does not store raw card data; payments are processed by LiqPay or another configured payment service.',
        },
        {
          title: 'Delivery',
          body: 'Delivery is made to the address provided during checkout. If details need clarification, Bloomify may contact the customer by the provided phone or email.',
        },
        {
          title: 'Restrictions',
          body: 'Do not use the site for fraud, attempts to access another personʼs data, service attacks, or submitting incorrect contact details.',
        },
      ],
    },
    pl: {
      label: 'Informacje prawne',
      title: 'Warunki korzystania',
      description:
        'Podstawowe zasady korzystania z Bloomify, składania zamówień i obsługi płatności.',
      sections: [
        {
          title: 'Cel usługi',
          body: 'Bloomify pozwala przeglądać bukiety, dodawać produkty do koszyka, zamawiać dostawę i płacić przez podłączonego operatora płatności.',
        },
        {
          title: 'Zamówienia i płatności',
          body: 'Końcowa wartość zamówienia jest obliczana po stronie serwera. Bloomify nie przechowuje danych kart; płatności obsługuje LiqPay lub inny skonfigurowany operator.',
        },
        {
          title: 'Dostawa',
          body: 'Dostawa odbywa się pod adres podany podczas składania zamówienia. Jeśli szczegóły wymagają doprecyzowania, Bloomify może skontaktować się telefonicznie lub mailowo.',
        },
        {
          title: 'Ograniczenia',
          body: 'Nie używaj strony do oszustw, prób dostępu do cudzych danych, ataków na usługę ani przekazywania nieprawidłowych danych kontaktowych.',
        },
      ],
    },
  },
  privacy: {
    uk: {
      label: 'Приватність',
      title: 'Політика конфіденційності',
      description:
        'Як Bloomify працює з контактними даними, замовленнями, аналітикою та платіжними інтеграціями.',
      sections: [
        {
          title: 'Які дані використовуються',
          body: 'Для оформлення замовлення Bloomify використовує імʼя, телефон, email, місто, адресу доставки, коментар до доставки та склад кошика.',
        },
        {
          title: 'Платежі',
          body: 'Платіжні дані передаються платіжному провайдеру. Bloomify не зберігає повні реквізити картки та не обробляє їх напряму.',
        },
        {
          title: 'Аналітика та помилки',
          body: 'Сайт може використовувати аналітику та Sentry для розуміння технічних помилок і покращення продукту. У production не слід передавати зайві персональні дані в телеметрію.',
        },
        {
          title: 'Зберігання',
          body: 'Дані замовлень зберігаються стільки, скільки потрібно для обробки, підтримки клієнта, операційної звітності та законних бізнес-потреб.',
        },
      ],
    },
    en: {
      label: 'Privacy',
      title: 'Privacy policy',
      description:
        'How Bloomify works with contact details, orders, analytics, and payment integrations.',
      sections: [
        {
          title: 'Data we use',
          body: 'To place an order, Bloomify uses the customer name, phone, email, city, delivery address, delivery note, and cart contents.',
        },
        {
          title: 'Payments',
          body: 'Payment details are sent to the payment provider. Bloomify does not store full card credentials and does not process them directly.',
        },
        {
          title: 'Analytics and errors',
          body: 'The site may use analytics and Sentry to understand technical errors and improve the product. Production telemetry should not receive unnecessary personal data.',
        },
        {
          title: 'Storage',
          body: 'Order data is stored for as long as needed to process orders, support customers, prepare operational reporting, and satisfy legitimate business needs.',
        },
      ],
    },
    pl: {
      label: 'Prywatność',
      title: 'Polityka prywatności',
      description:
        'Jak Bloomify pracuje z danymi kontaktowymi, zamówieniami, analityką i integracjami płatniczymi.',
      sections: [
        {
          title: 'Dane, których używamy',
          body: 'Do złożenia zamówienia Bloomify używa imienia i nazwiska, telefonu, emaila, miasta, adresu dostawy, notatki do dostawy oraz zawartości koszyka.',
        },
        {
          title: 'Płatności',
          body: 'Dane płatnicze są przekazywane operatorowi płatności. Bloomify nie przechowuje pełnych danych karty i nie przetwarza ich bezpośrednio.',
        },
        {
          title: 'Analityka i błędy',
          body: 'Strona może używać analityki i Sentry do rozumienia błędów technicznych oraz ulepszania produktu. Telemetria produkcyjna nie powinna otrzymywać zbędnych danych osobowych.',
        },
        {
          title: 'Przechowywanie',
          body: 'Dane zamówień są przechowywane tak długo, jak jest to potrzebne do obsługi zamówień, wsparcia klientów, raportowania operacyjnego i uzasadnionych potrzeb biznesowych.',
        },
      ],
    },
  },
};

type LegalPageProps = {
  kind: LegalPageKind;
  locale: Locale;
};

export function getLegalPageContent(kind: LegalPageKind, locale: Locale) {
  return legalContent[kind][locale];
}

export default function LegalPage({ kind, locale }: LegalPageProps) {
  const content = getLegalPageContent(kind, locale);

  return (
    <PageShell
      containerSize='sm'
      header={{
        label: content.label,
        title: content.title,
        description: content.description,
      }}>
      <SurfacePanel className='space-y-6'>
        {content.sections.map((section) => (
          <section
            key={section.title}
            className='space-y-2'>
            <h2 className='font-display text-xl font-semibold text-foreground'>
              {section.title}
            </h2>
            <p className='leading-7 text-muted-foreground'>{section.body}</p>
          </section>
        ))}
      </SurfacePanel>
    </PageShell>
  );
}
