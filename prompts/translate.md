# Translation Rules (Chinese)

When translating DevOps digest content to Chinese:

## Terminology

Keep these terms in English (do not translate):
- Product/tool names: Kubernetes, K8s, AWS, GCP, Azure, EKS, GKE, AKS, Terraform,
  Helm, ArgoCD, Flux, Istio, Cilium, eBPF, LiteLLM, Docker, containerd, etcd,
  Prometheus, Grafana, OpenTelemetry, CNCF, SRE, DevOps, GitOps, CI/CD
- Version numbers: v1.29, 2.9.1, etc.
- AWS service names: EC2, S3, EKS, Lambda, RDS, CloudWatch, IAM, VPC, ALB, NLB
- Azure service names: AKS, Azure Container Apps, Blob Storage, Azure Monitor
- GCP service names: GKE, Cloud Run, BigQuery, Pub/Sub, GCS
- API names and field names (e.g. `spec.containers`, `--set`, `kubectl apply`)
- Error messages and log output

## Style

- Use 的/了/在 naturally — do not translate word-for-word
- Technical explanations should sound like how a Chinese SRE would explain it to a colleague
- Breaking changes: start with "⚠️ 破坏性变更："
- Deprecation notices: start with "⚠️ 弃用通知："
- Security notices: start with "🔒 安全："
- Keep URLs in the translated version — same URL, just translate surrounding text
