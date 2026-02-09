import { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    nav: { home: "Home", players: "Players", matches: "Matches", clubs: "Clubs", about: "About" },
    hero: {
      title: "The Home of Georgian Football Talent",
      subtitle: "Discover youth players, watch matches, access scouting reports.",
      cta: "Browse Players"
    },
    stats: { players: "Players", academies: "Academies", matches: "Matches", scoutCountries: "Scout Countries" },
    sections: {
      featured: "Featured Players",
      trending: "Trending Players",
      recentlyAdded: "Recently Added",
      allPlayers: "Player Database",
      allMatches: "Match Library",
      clubs: "Clubs"
    },
    filters: {
      search: "Search players...",
      position: "Position",
      ageCategory: "Age Category",
      foot: "Preferred Foot",
      club: "Club",
      all: "All",
      left: "Left",
      right: "Right",
      both: "Both",
      reset: "Reset Filters"
    },
    player: {
      info: "Player Information",
      dob: "Date of Birth",
      height: "Height",
      weight: "Weight",
      foot: "Preferred Foot",
      nationality: "Nationality",
      seasonStats: "Season Statistics",
      matches: "Matches",
      goals: "Goals",
      assists: "Assists",
      minutes: "Minutes",
      scoutingReport: "Scouting Report",
      playingStyle: "Playing Style",
      strengths: "Strengths",
      development: "Development Areas",
      overallRating: "Overall Rating",
      scoutedBy: "Scouted by",
      videos: "Videos",
      highlight: "Highlights",
      fullMatch: "Full Match",
      requestContact: "Request Player Contact",
      addToShortlist: "Add to Shortlist",
      removeFromShortlist: "Remove from Shortlist",
      compare: "Compare Players",
      skills: "Player Skills"
    },
    match: {
      viewMatch: "View Match",
      matchReport: "Match Report",
      topPerformers: "Top Performers",
      fullVideo: "Full Match Video"
    },
    club: {
      founded: "Founded",
      squad: "Squad",
      matches: "Club Matches"
    },
    about: {
      title: "About Georgian Football Talent",
      mission: "Our Mission",
      missionText: "We are building the definitive platform for Georgian youth football talent. Our goal is to connect promising young players with scouts, agents, and clubs worldwide — giving Georgian talent the global visibility it deserves.",
      whatWeDo: "What We Do",
      whatWeDoText: "We centralize player data, match footage, and scouting reports into one professional platform. Scouts can search, filter, and discover players. Academies can showcase their talent. Players get seen.",
      contact: "Contact Us",
      contactText: "Interested in partnering with us? Reach out at"
    },
    contact: {
      title: "Request Player Contact",
      name: "Your Name",
      email: "Email Address",
      organization: "Organization",
      message: "Message",
      send: "Send Request",
      sent: "Request Sent!",
      close: "Close"
    },
    compare: {
      title: "Compare Players",
      select: "Select a player to compare",
      vs: "vs"
    },
    shortlist: {
      title: "My Shortlist",
      empty: "No players in your shortlist yet.",
      view: "View Shortlist"
    },
    notFound: {
      title: "404",
      subtitle: "Page not found",
      back: "Back to Home"
    },
    footer: {
      tagline: "Connecting Georgian football talent with the world.",
      rights: "All rights reserved."
    }
  },
  ka: {
    nav: { home: "მთავარი", players: "მოთამაშეები", matches: "მატჩები", clubs: "კლუბები", about: "შესახებ" },
    hero: {
      title: "ქართული ფეხბურთის ნიჭის სახლი",
      subtitle: "აღმოაჩინეთ ახალგაზრდა მოთამაშეები, უყურეთ მატჩებს, მიიღეთ სკაუტინგის ანგარიშები.",
      cta: "მოთამაშეების ნახვა"
    },
    stats: { players: "მოთამაშე", academies: "აკადემია", matches: "მატჩი", scoutCountries: "სკაუტის ქვეყანა" },
    sections: {
      featured: "გამორჩეული მოთამაშეები",
      trending: "ტრენდული მოთამაშეები",
      recentlyAdded: "ახლად დამატებული",
      allPlayers: "მოთამაშეების ბაზა",
      allMatches: "მატჩების ბიბლიოთეკა",
      clubs: "კლუბები"
    },
    filters: {
      search: "მოთამაშეების ძიება...",
      position: "პოზიცია",
      ageCategory: "ასაკობრივი კატეგორია",
      foot: "სასურველი ფეხი",
      club: "კლუბი",
      all: "ყველა",
      left: "მარცხენა",
      right: "მარჯვენა",
      both: "ორივე",
      reset: "ფილტრის გასუფთავება"
    },
    player: {
      info: "მოთამაშის ინფორმაცია",
      dob: "დაბადების თარიღი",
      height: "სიმაღლე",
      weight: "წონა",
      foot: "სასურველი ფეხი",
      nationality: "ეროვნება",
      seasonStats: "სეზონის სტატისტიკა",
      matches: "მატჩები",
      goals: "გოლები",
      assists: "ასისტები",
      minutes: "წუთები",
      scoutingReport: "სკაუტინგის ანგარიში",
      playingStyle: "თამაშის სტილი",
      strengths: "ძლიერი მხარეები",
      development: "განვითარების სფეროები",
      overallRating: "საერთო რეიტინგი",
      scoutedBy: "სკაუტი",
      videos: "ვიდეოები",
      highlight: "მომენტები",
      fullMatch: "სრული მატჩი",
      requestContact: "კონტაქტის მოთხოვნა",
      addToShortlist: "შორთლისტში დამატება",
      removeFromShortlist: "შორთლისტიდან წაშლა",
      compare: "მოთამაშეების შედარება",
      skills: "მოთამაშის უნარები"
    },
    match: {
      viewMatch: "მატჩის ნახვა",
      matchReport: "მატჩის ანგარიში",
      topPerformers: "საუკეთესო მოთამაშეები",
      fullVideo: "სრული მატჩის ვიდეო"
    },
    club: {
      founded: "დაარსდა",
      squad: "შემადგენლობა",
      matches: "კლუბის მატჩები"
    },
    about: {
      title: "ქართული ფეხბურთის ნიჭის შესახებ",
      mission: "ჩვენი მისია",
      missionText: "ჩვენ ვქმნით ქართული ახალგაზრდული ფეხბურთის ნიჭის საბოლოო პლატფორმას. ჩვენი მიზანია დავაკავშიროთ პერსპექტიული ახალგაზრდა მოთამაშეები სკაუტებთან, აგენტებთან და კლუბებთან მთელ მსოფლიოში.",
      whatWeDo: "რას ვაკეთებთ",
      whatWeDoText: "ჩვენ ვაერთიანებთ მოთამაშეების მონაცემებს, მატჩების ვიდეოებს და სკაუტინგის ანგარიშებს ერთ პროფესიონალურ პლატფორმაზე.",
      contact: "დაგვიკავშირდით",
      contactText: "დაინტერესებული ხართ თანამშრომლობით? მოგვწერეთ"
    },
    contact: {
      title: "მოთამაშის კონტაქტის მოთხოვნა",
      name: "თქვენი სახელი",
      email: "ელ-ფოსტა",
      organization: "ორგანიზაცია",
      message: "შეტყობინება",
      send: "მოთხოვნის გაგზავნა",
      sent: "მოთხოვნა გაგზავნილია!",
      close: "დახურვა"
    },
    compare: {
      title: "მოთამაშეების შედარება",
      select: "აირჩიეთ მოთამაშე შესადარებლად",
      vs: "vs"
    },
    shortlist: {
      title: "ჩემი შორთლისტი",
      empty: "შორთლისტი ცარიელია.",
      view: "შორთლისტის ნახვა"
    },
    notFound: {
      title: "404",
      subtitle: "გვერდი ვერ მოიძებნა",
      back: "მთავარზე დაბრუნება"
    },
    footer: {
      tagline: "ქართული ფეხბურთის ნიჭის მსოფლიოსთან დაკავშირება.",
      rights: "ყველა უფლება დაცულია."
    }
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const t = translations[lang];
  const toggleLang = () => setLang(l => l === 'en' ? 'ka' : 'en');

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
