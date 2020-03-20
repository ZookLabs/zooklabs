package zooklabs.endpoints.discord

case class DiscordWebhook(
    embeds: List[Embed]
)

case class Embed(
    title: String,
    url: String,
    color: Double,
    thumbnail: Thumbnail,
    fields: List[Field]
)

case class Thumbnail(
    url: String
)

case class Field (
    name: String,
    value: String,
    inline: Boolean = true
)
