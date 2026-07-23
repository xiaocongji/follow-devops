# Follow DevOps

A Claude Code skill that tracks the top Kubernetes, AWS, GCP, Azure, and LiteLLM
practitioners — people actually running production systems and shipping open-source
tools — and delivers curated digests of what they're saying.

**Philosophy:** Follow practitioners with original opinions, not accounts that repost
release notes.

## What You Get

A daily or weekly digest rendered as a **rich HTML page** (opens in your browser) with:

- Card grid of official release announcements from AWS, Kubernetes, CNCF — with cover images
- X/Twitter posts from 25 curated DevOps practitioners
- Summaries of new DevOps/cloud-native YouTube episodes
- Breaking changes, deprecations, and security notices called out explicitly
- Available in English, Chinese, or bilingual

![Digest preview showing card grid with AWS and CNCF blog posts](examples/preview.png)

## Quick Start

```bash
git clone https://github.com/xiaocongji/follow-devops.git ~/.claude/skills/follow-devops
cd ~/.claude/skills/follow-devops/scripts && npm install
```

Then in Claude Code, type `/follow-devops` to run the skill.

## Invoking

```
/follow-devops
```

Type `/follow-devops` anytime to get a fresh digest opened in your browser. No delivery setup required.

## Delivery Methods

| Method | Setup | Notes |
|--------|-------|-------|
| **HTML** (default) | None | Opens `/tmp/devops-digest.html` in your browser |
| **Telegram** | Bot token + chat ID | Instant push to phone |
| **Email** | Gmail App Password | Sends from your Gmail via SMTP |
| **Slack** | Incoming Webhook URL | Posts to a channel or DM |
| **stdout** | None | Plain text in terminal |

Change delivery method by telling the agent: "Switch to Telegram delivery" etc.

## Changing Settings

Just tell the agent:

- "Switch to weekly digests on Monday mornings"
- "Change language to Chinese"
- "Make the summaries shorter"
- "Focus more on Kubernetes"
- "Show me my current settings"

## Customizing the Summaries

Edit the plain-English prompt files in `prompts/` — or just tell the agent what you want and it will update them for you:

- `summarize-tweets.md` — how X/Twitter posts are summarized
- `summarize-podcast.md` — how podcast/video episodes are summarized
- `summarize-blogs.md` — how official release blogs are summarized
- `digest-intro.md` — overall digest format, order, and tone
- `translate.md` — Chinese translation rules

## Default Sources

### X/Twitter Practitioners (25)

| Name | Handle | Focus |
|------|--------|-------|
| Kelsey Hightower | [@kelseyhightower](https://x.com/kelseyhightower) | Kubernetes, Cloud Native |
| Liz Rice | [@lizrice](https://x.com/lizrice) | Kubernetes, eBPF, Security |
| Tim Hockin | [@thockin](https://x.com/thockin) | Kubernetes, Networking |
| Brendan Burns | [@brendandburns](https://x.com/brendandburns) | Kubernetes, Azure |
| Joe Beda | [@jbeda](https://x.com/jbeda) | Kubernetes, Cloud Native |
| Charity Majors | [@mipsytipsy](https://x.com/mipsytipsy) | Observability, SRE, DevOps |
| Cindy Sridharan | [@copyconstruct](https://x.com/copyconstruct) | Distributed Systems, Platform Eng |
| Corey Quinn | [@quinnypig](https://x.com/quinnypig) | AWS, Cloud Economics |
| Jeff Barr | [@jeffbarr](https://x.com/jeffbarr) | AWS, New Releases |
| Werner Vogels | [@Werner](https://x.com/Werner) | AWS, Distributed Systems |
| Forrest Brazeal | [@forrestbrazeal](https://x.com/forrestbrazeal) | GCP, Serverless, Cloud Native |
| Ahmet Balkan | [@ahmetb](https://x.com/ahmetb) | GCP, Kubernetes, Cloud Run |
| Kaslin Fields | [@kaslinfields](https://x.com/kaslinfields) | GCP, Kubernetes, CNCF |
| Michael Hausenblas | [@mhausenblas](https://x.com/mhausenblas) | AWS, Observability, eBPF |
| Kat Cosgrove | [@Dixie3Flatline](https://x.com/Dixie3Flatline) | Kubernetes, CNCF |
| Aurelie Vache | [@aurelievache](https://x.com/aurelievache) | Kubernetes, Cloud Native |
| Viktor Farcic | [@vfarcic](https://x.com/vfarcic) | Kubernetes, GitOps, Crossplane |
| Adam Jacob | [@adamhjk](https://x.com/adamhjk) | DevOps, Platform Engineering |
| Mitchell Hashimoto | [@mitchellh](https://x.com/mitchellh) | Terraform, Infrastructure as Code |
| Nicki Watt | [@nickijwatt](https://x.com/nickijwatt) | Terraform, HashiCorp |
| Beyang Liu | [@beyang](https://x.com/beyang) | Developer Tools, Platform Eng |
| Guillermo Rauch | [@rauchg](https://x.com/rauchg) | Serverless, Edge Computing |
| Gerred Dillon | [@gerred](https://x.com/gerred) | Kubernetes, GitOps |
| BerriAI / LiteLLM | [@BerriAI](https://x.com/BerriAI) | LiteLLM Proxy, AI Infrastructure |
| Krrish Dholakia | [@krrishdholakia](https://x.com/krrishdholakia) | LiteLLM, LLM Gateway |

### YouTube / Podcasts (5)

- [Kubernetes Podcast from Google](https://www.youtube.com/@KubernetesPodcast)
- [DevOps Toolkit](https://www.youtube.com/@DevOpsToolkit)
- [Screaming in the Cloud](https://www.youtube.com/@ScreamingintheCloud)
- [AWS Events Channel](https://www.youtube.com/@AWSEventsChannel)
- [CNCF (KubeCon sessions)](https://www.youtube.com/@cncf)

### Official Blogs (6)

- [AWS News Blog](https://aws.amazon.com/blogs/aws/) — live RSS feed with og:images
- [Google Cloud Blog](https://cloud.google.com/blog/)
- [Azure Blog](https://azure.microsoft.com/en-us/blog/)
- [Kubernetes Blog](https://kubernetes.io/blog/)
- [LiteLLM Blog](https://blog.litellm.ai)
- [CNCF Blog](https://www.cncf.io/blog/) — live RSS feed with og:images

## How It Works

1. `prepare-digest.js` reads feed files and prompts, outputs a single JSON blob
2. Blog feeds are fetched live from RSS with og:images scraped from each post
3. The Claude agent remixes the content into summaries using your prompt preferences
4. `deliver.js --json` renders a rich HTML page with card grid and opens it in the browser

> **Note:** X/Twitter content uses a local mock feed until a real feed generator is wired up. Blog and podcast content works live via RSS/HTTP.

## Requirements

- Claude Code (or any Claude agent that supports skills)
- Node.js 18+
- Internet connection (for live RSS blog feeds)

No API keys required for the default HTML delivery mode.

## Configuration

Settings stored in `~/.follow-devops/config.json`:

```json
{
  "platform": "other",
  "language": "en",
  "timezone": "Asia/Shanghai",
  "frequency": "daily",
  "deliveryTime": "09:00",
  "delivery": {
    "method": "html"
  },
  "onboardingComplete": true
}
```

Supported languages: `en`, `zh`, `bilingual`

## Privacy

- All configuration stays on your machine in `~/.follow-devops/`
- API keys (Telegram, Gmail, Slack) stored locally in `~/.follow-devops/.env`
- Only reads public content (RSS feeds, public blog posts, public X posts)

## License

MIT
