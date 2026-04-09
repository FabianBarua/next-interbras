import type { HeroBanner } from "../types/banner"

export const bannersMock: HeroBanner[] = [
  {
    id: "hero-1",
    title: { es: "Smart TVs QLED", pt: "Smart TVs QLED" },
    subtitle: { es: "Descubre la última tecnología en televisores", pt: "Descubra a última tecnologia em televisores" },
    imageUrl: "/productos/tvs/IN5500TV-1.webp",
    active: true,
    ctaText: { es: "Ver Televisores", pt: "Ver Televisores" },
    linkStr: "/productos/tvs",
  },
  {
    id: "hero-2",
    title: { es: "Movilidad Eléctrica", pt: "Mobilidade Elétrica" },
    subtitle: { es: "Patinetas y scooters para la ciudad", pt: "Patinetes elétricos para a cidade" },
    imageUrl: "/productos/scooters/10.5-ultra-1.webp",
    active: true,
    ctaText: { es: "Ver Patinetas", pt: "Ver Patinetes" },
    linkStr: "/productos/scooters",
  },
  {
    id: "hero-3",
    title: { es: "Cocina Saludable", pt: "Cozinha Saudável" },
    subtitle: { es: "Airfryers: sin aceite, mismo sabor", pt: "Airfryers: sem óleo, mesmo sabor" },
    imageUrl: "/productos/airfryer/s40-v1-1.webp",
    active: true,
    ctaText: { es: "Ver Airfryers", pt: "Ver Airfryers" },
    linkStr: "/productos/airfryer",
  },
  {
    id: "hero-4",
    title: { es: "Hoverboards", pt: "Hoverboards" },
    subtitle: { es: "Diversión y estilo para toda la familia", pt: "Diversão e estilo para toda a família" },
    imageUrl: "/productos/hoverboards/hoverboards3-1.webp",
    active: true,
    ctaText: { es: "Ver Hoverboards", pt: "Ver Hoverboards" },
    linkStr: "/productos/hoverboards",
  },
  {
    id: "hero-5",
    title: { es: "Triciclos para Niños", pt: "Triciclos para Crianças" },
    subtitle: { es: "Diseños divertidos y colores llamativos", pt: "Designs divertidos e cores chamativas" },
    imageUrl: "/productos/triciclos/65-N1.webp",
    active: true,
    ctaText: { es: "Ver Triciclos", pt: "Ver Triciclos" },
    linkStr: "/productos/triciclos",
  },
]
