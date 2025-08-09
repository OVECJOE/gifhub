export type ApiGif = {
    id: string
    filename: string
    originalName: string
    downloads: number
    createdAt: string
    fileSize: number
    duration: number
    width: number
    height: number
    repository: { id: string; name: string }
}