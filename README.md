# Follow DevOps

A Claude Code skill that tracks the top Kubernetes, AWS, GCP, Azure, and LiteLLM
practitioners — people actually running production systems and shipping open-source
tools — and delivers curated digests of what they're saying.

**Philosophy:** Follow practitioners with original opinions, not accounts that repost
release notes.

## What You Get

A daily or weekly digest delivered to your preferred messaging app (Telegram, email,
or in-chat) with:

- Key posts and insights from 25 curated DevOps practitioners on X/Twitter
- Official release announcements from AWS, Google Cloud, Azure, Kubernetes, LiteLLM, and CNCF
- Summaries of new episodes from top DevOps/cloud-native YouTube channels
- Breaking changes, deprecations, and security notices called out explicitly
- Available in English, Chinese, or bilingual

## Quick Start

1. Install the skill:
   ```bash
   git clone https://github.com/xiaocongji/follow-devops.git ~/.claude/skills/follow-devops
   cd ~/.claude/skills/follow-devops/scripts && npm install
   ```
2. In Claude Code, say "set up follow devops" or invoke `/devops`
3. The agent walks you through setup conversationally — no config files to edit

The agent will ask you:
- How often you want your digest (daily or weekly) and what time
- What language you prefer
- How you want it delivered (Telegram, email, or in-chat)

Your first digest arrives immediately after setup.

## Invoking

```
/devops
```

Type `/devops` anytime in Claude Code to get your digest on demand.

## Changing Settings

Just tell the agent:

- "Switch to weekly digests on Monday mornings"
- "Change language to Chinese"
- "Make the summaries shorter"
- "Focus more on Kubernetes"
- "Show me my current settings"

## Customizing the Summaries

The skill uses plain-English prompt files in `prompts/` to control how content is
summarized. You can customize them through conversation or edit them directly:

- `summarize-tweets.md` — how X/Twitter posts are summarized
- `summarize-podcast.md` — how podcast/video episodes are summarized
- `summarize-blogs.md` — how official release blogs are summarized
- `digest-intro.md` — the overall digest format, order, and tone
- `translate.md` — how English content is translated to Chinese

Changes take effect on the next digest run.

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
- [DevOps Toolkit](https://www.youtube.com/@DevOpsToolkit) — Viktor Farcic
- [Screaming in the Cloud](https://www.youtube.com/@ScreamingintheCloud) — Corey Quinn
- [AWS Events Channel](https://www.youtube.com/@AWSEventsChannel)
- [CNCF (KubeCon sessions)](https://www.youtube.com/@cncf)

### Official Blogs (6)

- [AWS News Blog](https://aws.amazon.com/blogs/aws/)
- [Google Cloud Blog](https://cloud.google.com/blog/)
- [Azure Blog](https://azure.microsoft.com/en-us/blog/)
- [Kubernetes Blog](https://kubernetes.io/blog/)
- [LiteLLM Blog](https://blog.litellm.ai)
- [CNCF Blog](https://www.cncf.io/blog/)

## How It Works

1. `prepare-digest.js` reads your local feed files and prompts, and outputs a single JSON blob
2. The Claude agent remixes the content into a digest following your prompt preferences
3. `deliver.js` sends the digest to your chosen channel (Telegram, email, or stdout)

> **Note:** Unlike `follow-builders`, this skill does not yet have a central hosted feed.
> X/Twitter content requires a local feed generator connected to a data source.
> Blog and podcast content works via direct RSS/HTTP fetching. Contributions welcome!

## Requirements

- Claude Code (or any Claude agent that supports skills)
- Node.js 18+
- Internet connection

No API keys needed for blog content. Telegram or email delivery requires those respective keys (the agent guides you through setup).

## Configuration

Settings are stored in `~/.follow-devops/config.json`. Edit through conversation or directly:

```json
{
  "platform": "other",
  "language": "en",
  "timezone": "Asia/Shanghai",
  "frequency": "daily",
  "deliveryTime": "09:00",
  "delivery": {
    "method": "stdout"
  },
  "onboardingComplete": true
}
```

Supported languages: `en`, `zh`, `bilingual`

## Privacy

- All configuration stays on your machine in `~/.follow-devops/`
- API keys (Telegram, Resend) are stored locally in `~/.follow-devops/.env`
- The skill only reads public content

## License

MIT
