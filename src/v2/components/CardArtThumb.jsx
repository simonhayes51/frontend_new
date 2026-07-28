// src/v2/components/CardArtThumb.jsx
//
// Thin wrapper around the shared (v1) PlayerCardArt, sized + configured
// for v2 list-row use. `card` is any of the row shapes coming out of the
// backend's card-art-extended endpoints
// ({card_id, name, rating, version, image_url, card_bg_image,
//   card_cutout_image, card_cutout_type, card_name}), so every v2 list
// section can pass its item straight through with no reshaping.
//
// fallbackImage={card.image_url} is load-bearing: image_url is a plain,
// always-present fut_players column (unlike the 4 new nullable columns),
// and PlayerCardArt's existing bgImage-present/absent branch already
// renders it cleanly whenever card_bg_image is still null mid-backfill -
// no code change needed there, just correct prop wiring here.
import PlayerCardArt from "../../components/PlayerCardArt";

export default function CardArtThumb({ card, widthClass = "w-10" }) {
  if (!card) return null;
  return (
    <PlayerCardArt
      compact
      bgImage={card.card_bg_image}
      cutoutImage={card.card_cutout_image}
      cutoutType={card.card_cutout_type || "special"}
      fallbackImage={card.image_url}
      rating={card.rating}
      altText={card.card_name || card.name}
      widthClass={widthClass}
    />
  );
}
