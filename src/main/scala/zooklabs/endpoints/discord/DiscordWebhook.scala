package zooklabs.endpoints.discord

case class DiscordWebhook(
    username: String,
    content: String,
    embeds: List[Embeds]
)

case class Embeds(
    title: String,
    url: String,
    color: Double,
    thumbnail: Thumbnail
)

case class Thumbnail(
    url: String
)
