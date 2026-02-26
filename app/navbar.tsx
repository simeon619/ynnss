import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { YnsLink } from "@/components/yns-link";
import { buildTree } from "@/lib/category-utils";
import { commerce } from "@/lib/commerce";
import { cn } from "@/lib/utils";

export async function Navbar() {
	const { data: allCategories } = await commerce.categoryBrowse();
	const categoryTree = buildTree(allCategories);

	return (
		<nav className="hidden sm:flex items-center">
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem>
						<NavigationMenuLink asChild>
							<YnsLink href="/" prefetch={"eager"} className={navigationMenuTriggerStyle()}>
								Accueil
							</YnsLink>
						</NavigationMenuLink>
					</NavigationMenuItem>

					{categoryTree.map((category) => (
						<NavigationMenuItem key={category.id}>
							{category.children.length > 0 ? (
								<>
									<NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
											<li className="row-span-3">
												<NavigationMenuLink asChild>
													<YnsLink
														className="flex h-full w-full select-none flex-col justify-end border-2 border-black bg-white p-6 no-underline outline-none hover:bg-black hover:text-white"
														href={`/category/${category.slug}`}
													>
														<div className="mb-2 mt-4 text-lg font-medium">{category.name}</div>
														<p className="text-sm leading-tight text-muted-foreground">
															{category.description || `Browse all ${category.name}`}
														</p>
													</YnsLink>
												</NavigationMenuLink>
											</li>
											{category.children.map((child) => (
												<ListItem key={child.id} title={child.name} href={`/category/${child.slug}`}>
													{child.description}
												</ListItem>
											))}
										</ul>
									</NavigationMenuContent>
								</>
							) : (
								<NavigationMenuLink asChild>
									<YnsLink
										href={`/category/${category.slug}`}
										prefetch={"eager"}
										className={navigationMenuTriggerStyle()}
									>
										{category.name}
									</YnsLink>
								</NavigationMenuLink>
							)}
						</NavigationMenuItem>
					))}
				</NavigationMenuList>
			</NavigationMenu>
		</nav>
	);
}

const ListItem = ({
	className,
	title,
	children,
	href,
	...props
}: React.ComponentPropsWithoutRef<"a"> & { title: string; href: string }) => {
	return (
		<li>
			<NavigationMenuLink asChild>
				<YnsLink
					href={href}
					className={cn(
						"block select-none space-y-1 p-3 leading-none no-underline outline-none border-2 border-transparent hover:border-black hover:bg-black hover:text-white",
						className,
					)}
					{...props}
				>
					<div className="text-sm font-medium leading-none">{title}</div>
					<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
				</YnsLink>
			</NavigationMenuLink>
		</li>
	);
};
